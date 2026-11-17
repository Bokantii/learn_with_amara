import { prisma } from '../prisma';
import {
  entitledUserIdsForLiveClass,
  NOTIFY_ENROLLMENT_STATUSES,
} from '../live-class-entitlement';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
}

/**
 * Students entitled to *push* about a program (optionally narrowed to a group).
 * `NOTIFY_ENROLLMENT_STATUSES` (ACTIVE + COMPLETED); group membership alone is
 * never enough. Shared by the assignment/lesson events and announcement
 * targeting. This is the program/group inverse of `entitledUserIdsForLiveClass`
 * with the notify status set.
 */
export function resolveProgramGroupRecipientIds(
  programId: string,
  groupId?: string | null
): Promise<string[]> {
  return entitledUserIdsForLiveClass(
    { programId, groupId: groupId ?? null },
    NOTIFY_ENROLLMENT_STATUSES
  );
}

/** Every student account with at least one NOTIFY-status enrollment. */
export async function resolveAllStudentRecipientIds(): Promise<string[]> {
  const rows = await prisma.enrollment.findMany({
    where: {
      status: { in: NOTIFY_ENROLLMENT_STATUSES },
      user: { role: 'STUDENT' },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.map((r) => r.userId);
}

/**
 * Who currently receives PUSHED communication about a live class. Delegates the
 * entitlement rule to `entitledUserIdsForLiveClass` (the single source of truth,
 * shared with the student-facing view) and uses the narrower NOTIFY status set
 * — PENDING/PAUSED enrollees are entitled to see the class but not to be
 * emailed about it.
 */
export async function resolveLiveClassRecipients(
  liveClass: { programId: string; groupId: string | null }
): Promise<NotificationRecipient[]> {
  const userIds = await entitledUserIdsForLiveClass(liveClass, NOTIFY_ENROLLMENT_STATUSES);
  if (userIds.length === 0) return [];

  return prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
}
