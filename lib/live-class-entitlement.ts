import { prisma } from './prisma';
import type { EnrollmentStatus } from './generated/prisma/client';

/**
 * Single source of truth for live-class entitlement (SPEC §10.6).
 *
 * A student is entitled to a live class when they have an enrollment in the
 * class's program with a qualifying status AND — for a group-scoped class —
 * are a current member of that group. A stale `GroupMembership` alone is never
 * sufficient.
 *
 * Two status sets, deliberately different:
 *
 *  - VISIBLE  — what the student can SEE on the dashboard (pull). Everything
 *    except a cancelled enrollment.
 *  - NOTIFY   — who receives PUSHED communication (email + in-app bell).
 *    Narrower on purpose: a not-yet-confirmed (PENDING) or paused student
 *    should not get class reminders / Zoom links pushed to their inbox.
 *
 * `app/dashboard/liveclasses/page.tsx` resolves the inverse direction
 * (given a user, which classes) and consumes VISIBLE_ENROLLMENT_STATUSES so the
 * two never drift.
 */
export const VISIBLE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
];

export const NOTIFY_ENROLLMENT_STATUSES: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED'];

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
    where: { programId: liveClass.programId, status: { in: statuses } },
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
