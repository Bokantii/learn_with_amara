import { prisma } from './prisma';
import type { EnrollmentStatus } from './generated/prisma/client';
import {
  VISIBLE_ENROLLMENT_STATUSES,
  NOTIFY_ENROLLMENT_STATUSES,
} from './enrollment/status';

/**
 * Live-class entitlement (SPEC §10.6). A student is entitled to a live class
 * when they have an enrollment in the class's program with a qualifying status
 * AND — for a group-scoped class — are a current member of that group. A stale
 * `GroupMembership` alone is never sufficient.
 *
 * The enrollment-status sets live in `lib/enrollment/status.ts` (the single
 * source of truth); re-exported here for the existing call sites.
 */
export { VISIBLE_ENROLLMENT_STATUSES, NOTIFY_ENROLLMENT_STATUSES };

/**
 * Resolve the user ids currently entitled to `liveClass` under `statuses`.
 * Recipients are always resolved fresh — never from a stored list — so a
 * student who drops the program/group after the class is scheduled stops being
 * entitled automatically.
 */
export async function entitledUserIdsForLiveClass(
  liveClass: { programId: string; groupId: string | null },
  statuses: EnrollmentStatus[]
): Promise<string[]> {
  const enrollments = await prisma.enrollment.findMany({
    // Enrollments model student membership — a stray enrollment on a staff
    // account must never make it a push/attendance recipient.
    where: {
      programId: liveClass.programId,
      status: { in: statuses },
      user: { role: 'STUDENT' },
    },
    select: { userId: true },
  });
  let ids = new Set(enrollments.map((e) => e.userId));

  if (liveClass.groupId && ids.size > 0) {
    const members = await prisma.groupMembership.findMany({
      where: { groupId: liveClass.groupId, userId: { in: [...ids] } },
      select: { userId: true },
    });
    ids = new Set(members.map((m) => m.userId));
  }

  return [...ids];
}

/**
 * Is `userId` currently entitled to `liveClass`? Thin boolean wrapper around
 * `entitledUserIdsForLiveClass` for one-user checks (e.g. QR attendance
 * check-in) — defaults to VISIBLE_ENROLLMENT_STATUSES (what the student can
 * see/act on), not NOTIFY_ENROLLMENT_STATUSES (who gets pushed reminders) —
 * a PENDING/PAUSED student can still check in to a class they can see.
 */
export async function isUserEntitledToLiveClass(
  userId: string,
  liveClass: { programId: string; groupId: string | null },
  statuses: EnrollmentStatus[] = VISIBLE_ENROLLMENT_STATUSES
): Promise<boolean> {
  const entitledIds = await entitledUserIdsForLiveClass(liveClass, statuses);
  return entitledIds.includes(userId);
}
