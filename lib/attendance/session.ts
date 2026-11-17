import { prisma } from '../prisma';
import { generateAttendanceToken } from './token';
import { ATTENDANCE_SESSION_DURATION_MINUTES } from './constants';

/**
 * Admin-side attendance session lifecycle — used by the admin server actions
 * (start/close/poll). Deliberately does NOT re-validate the LiveClass's
 * status (e.g. SCHEDULED-only) here: that business-rule guard belongs at the
 * calling server action, matching how `app/admin/liveclasses/actions.ts`
 * already does its own `findUniqueOrThrow` + status check inline rather than
 * in a shared lib function.
 */

/**
 * Starts a new OPEN attendance session for `liveClassId`, auto-closing any
 * existing OPEN session for the same class first (one active session per
 * class — see plan). Returns the raw token exactly once; only its hash is
 * persisted.
 */
export async function startAttendanceSession(
  liveClassId: string,
  createdByUserId: string
): Promise<{ sessionId: string; rawToken: string; expiresAt: Date }> {
  await prisma.attendanceSession.updateMany({
    where: { liveClassId, status: 'OPEN' },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  const { rawToken, tokenHash } = generateAttendanceToken();
  const expiresAt = new Date(Date.now() + ATTENDANCE_SESSION_DURATION_MINUTES * 60_000);

  const session = await prisma.attendanceSession.create({
    data: {
      liveClassId,
      createdBy: createdByUserId,
      tokenHash,
      expiresAt,
    },
    select: { id: true },
  });

  return { sessionId: session.id, rawToken, expiresAt };
}

/** Idempotent: closing an already-closed/expired session is a no-op. */
export async function closeAttendanceSession(sessionId: string): Promise<void> {
  await prisma.attendanceSession.updateMany({
    where: { id: sessionId, status: 'OPEN' },
    data: { status: 'CLOSED', closedAt: new Date() },
  });
}

export interface AttendanceSessionStatusResult {
  status: string;
  expiresAt: Date;
  checkedInCount: number;
  recent: {
    studentUserId: string;
    studentName: string;
    status: string;
    checkedInAt: Date | null;
  }[];
}

/** Live status for the admin "Start Attendance" dialog's poll. */
export async function getAttendanceSessionStatus(
  sessionId: string
): Promise<AttendanceSessionStatusResult> {
  const session = await prisma.attendanceSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      status: true,
      expiresAt: true,
      records: {
        orderBy: { checkedInAt: 'desc' },
        take: 10,
        select: {
          studentUserId: true,
          status: true,
          checkedInAt: true,
          student: { select: { name: true } },
        },
      },
      _count: { select: { records: true } },
    },
  });

  return {
    status: session.status,
    expiresAt: session.expiresAt,
    checkedInCount: session._count.records,
    recent: session.records.map((r) => ({
      studentUserId: r.studentUserId,
      studentName: r.student.name,
      status: r.status,
      checkedInAt: r.checkedInAt,
    })),
  };
}
