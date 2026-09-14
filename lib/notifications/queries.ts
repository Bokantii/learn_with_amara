import type { NotificationType } from '../generated/prisma/client';
import { prisma } from '../prisma';

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientUserId: userId, channel: 'IN_APP', readAt: null },
  });
}

/**
 * Where a notification of this type takes the student when tapped. Falls back to
 * the bell's default `linkHref` when a type has no dedicated destination.
 */
export function notificationHref(type: NotificationType): string | null {
  switch (type) {
    case 'ANNOUNCEMENT':
      return '/dashboard/announcements';
    case 'ASSIGNMENT_PUBLISHED':
    case 'ASSIGNMENT_GRADED':
      return '/dashboard/assignments';
    case 'ENROLLMENT_CHANGED':
      return '/dashboard/myprograms';
    case 'ASSESSMENT_GRADED':
      return '/assessments/history';
    case 'LESSON_PUBLISHED':
      return '/dashboard/recordedlessons';
    default:
      return null; // CLASS_* → the bell's linkHref
  }
}

export async function getRecentNotifications(userId: string, limit = 10) {
  // Only the fields the bell renders — internal delivery metadata (dedupeKey,
  // failureReason, status, attempts, …) must not be serialized to the client.
  const rows = await prisma.notification.findMany({
    where: { recipientUserId: userId, channel: 'IN_APP' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, type: true, title: true, message: true, createdAt: true, readAt: true },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    createdAt: r.createdAt,
    readAt: r.readAt,
    href: notificationHref(r.type),
  }));
}
