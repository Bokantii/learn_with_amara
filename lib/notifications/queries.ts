import { prisma } from '../prisma';

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientUserId: userId, channel: 'IN_APP', readAt: null },
  });
}

export async function getRecentNotifications(userId: string, limit = 10) {
  // Only the fields the bell renders — internal delivery metadata (dedupeKey,
  // failureReason, status, attempts, …) must not be serialized to the client.
  return prisma.notification.findMany({
    where: { recipientUserId: userId, channel: 'IN_APP' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, title: true, message: true, createdAt: true, readAt: true },
  });
}
