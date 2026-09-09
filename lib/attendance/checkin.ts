import { prisma } from '../prisma';
import { checkAttendanceCheckInRateLimit } from '../rate-limit';
import { isUserEntitledToLiveClass } from '../live-class-entitlement';
import { hashAttendanceToken } from './token';
import { computeCheckInStatus } from './status';

/**
 * Core, caller-agnostic QR check-in validation (SPEC §11.10 / plan "Server-side
 * check-in validation, in strict order"). The web action, the mobile-ready API
 * route, and any future caller all funnel through this single function so the
 * validation order and rejection semantics never drift between callers.
 *
 * Rejection reasons are intentionally coarse where disclosure would let a
 * client enumerate token/session state: INVALID_OR_EXPIRED covers "unknown
 * token", "session not OPEN", and "session expired" identically.
 */

function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

export type CheckInFailureReason =
  | 'RATE_LIMITED'
  | 'INVALID_OR_EXPIRED'
  | 'CLASS_NOT_ELIGIBLE'
  | 'NOT_ENTITLED'
  | 'ALREADY_CHECKED_IN';

export type CheckInResult =
  | { ok: true; status: 'PRESENT' | 'LATE'; checkedInAt: Date }
  | { ok: false; reason: CheckInFailureReason; existingStatus?: string };

export type CheckInPreview =
  | {
      ok: true;
      liveClassId: string;
      title: string;
      instructorName: string;
      startsAt: Date;
      classStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    }
  | { ok: false };

/**
 * Read-only lookup for the student confirmation screen — shows which class the
 * scanned QR belongs to before the student commits to a check-in. Uses the same
 * non-enumerable semantics as the check-in itself: an unknown, closed, or
 * expired token is indistinguishable (`{ ok: false }`). The class's own status
 * is returned (not hidden) so the confirm screen can explain a
 * cancelled/completed class — that state is already visible to the student.
 * Does NOT write, does NOT consume the token, is NOT rate-limited (the confirm
 * action that follows is).
 */
export async function getCheckInPreview(rawToken: string): Promise<CheckInPreview> {
  const tokenHash = hashAttendanceToken(rawToken);
  const session = await prisma.attendanceSession.findUnique({ where: { tokenHash } });
  if (!session) return { ok: false };

  if (session.status !== 'OPEN' || session.expiresAt <= new Date()) {
    return { ok: false };
  }

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: session.liveClassId },
    select: { id: true, title: true, instructorName: true, startsAt: true, status: true },
  });
  if (!liveClass) return { ok: false };

  return {
    ok: true,
    liveClassId: liveClass.id,
    title: liveClass.title,
    instructorName: liveClass.instructorName,
    startsAt: liveClass.startsAt,
    classStatus: liveClass.status,
  };
}

export async function checkInToAttendanceSession(input: {
  rawToken: string;
  studentUserId: string;
}): Promise<CheckInResult> {
  const { rawToken, studentUserId } = input;

  const rateLimit = await checkAttendanceCheckInRateLimit(studentUserId);
  if (!rateLimit.success) {
    return { ok: false, reason: 'RATE_LIMITED' };
  }

  const tokenHash = hashAttendanceToken(rawToken);
  const session = await prisma.attendanceSession.findUnique({ where: { tokenHash } });
  if (!session) {
    return { ok: false, reason: 'INVALID_OR_EXPIRED' };
  }

  const now = new Date();
  const isExpired = session.expiresAt <= now;
  if (session.status !== 'OPEN' || isExpired) {
    if (session.status === 'OPEN' && isExpired) {
      // Lazily flip OPEN -> EXPIRED on read so the admin roster stays truthful
      // without a cron sweep. Best-effort: never let this update crash the
      // rejection response.
      await prisma.attendanceSession
        .update({ where: { id: session.id }, data: { status: 'EXPIRED' } })
        .catch(() => undefined);
    }
    return { ok: false, reason: 'INVALID_OR_EXPIRED' };
  }

  const liveClass = await prisma.liveClass.findUnique({ where: { id: session.liveClassId } });
  if (!liveClass || liveClass.status !== 'SCHEDULED') {
    return { ok: false, reason: 'CLASS_NOT_ELIGIBLE' };
  }

  const entitled = await isUserEntitledToLiveClass(studentUserId, liveClass);
  if (!entitled) {
    return { ok: false, reason: 'NOT_ENTITLED' };
  }

  const checkedInAt = new Date();
  const status = computeCheckInStatus(checkedInAt, liveClass.startsAt);

  try {
    await prisma.attendanceRecord.create({
      data: {
        liveClassId: liveClass.id,
        sessionId: session.id,
        studentUserId,
        status,
        source: 'QR_WEB',
        checkedInAt,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const existing = await prisma.attendanceRecord.findUnique({
      where: { liveClassId_studentUserId: { liveClassId: liveClass.id, studentUserId } },
    });
    return { ok: false, reason: 'ALREADY_CHECKED_IN', existingStatus: existing?.status };
  }

  return { ok: true, status, checkedInAt };
}
