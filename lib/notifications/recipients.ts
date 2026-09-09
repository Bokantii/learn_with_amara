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
