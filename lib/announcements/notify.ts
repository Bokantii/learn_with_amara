import { prisma } from '../prisma';
import { dispatchNotification, type NotificationRecipientInput } from '../notifications/dispatch';
import { originForEmails } from '../notifications/events';
import { resolveAnnouncementRecipientIds } from './targeting';
import AnnouncementEmail from '../../emails/AnnouncementEmail';

/**
 * Delivers a published announcement through the central notification system
 * (`type = ANNOUNCEMENT`, IN_APP + EMAIL). Re-reads the record and only sends
 * for a live announcement (published, not archived). Recipients are resolved
 * fresh from `resolveAnnouncementRecipientIds`. Publish is one-way, so
 * `dedupeKey = ANNOUNCEMENT:<id>:<userId>` makes a repeat call a no-op.
 */
export async function sendAnnouncementNotification(announcementId: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: {
      program: { select: { name: true } },
      group: { select: { name: true } },
      student: { select: { name: true } },
    },
  });
  if (!announcement || !announcement.publishedAt || announcement.archivedAt) return null;

  const ids = await resolveAnnouncementRecipientIds(announcement);
  if (ids.length === 0) return { recipients: 0, channels: {} };

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });

  const scopeLabel =
    announcement.scope === 'ALL'
      ? 'An announcement for all students'
      : announcement.scope === 'PROGRAM'
        ? announcement.program?.name ?? 'Your program'
        : announcement.scope === 'GROUP'
          ? announcement.group?.name ?? 'Your group'
          : 'A message for you';

  const appUrl = await originForEmails();

  return dispatchNotification({
    type: 'ANNOUNCEMENT',
    relatedEntityType: 'Announcement',
    relatedEntityId: announcement.id,
    channels: ['IN_APP', 'EMAIL'],
    recipients: users.map<NotificationRecipientInput>((user) => ({
      user,
      dedupeKey: `ANNOUNCEMENT:${announcement.id}:${user.id}`,
      title: announcement.title,
      message: announcement.body,
      emailMessage: {
        subject: announcement.title,
        react: AnnouncementEmail({
          studentName: user.name,
          announcementTitle: announcement.title,
          body: announcement.body,
          scopeLabel,
          appUrl,
        }),
      },
    })),
  });
}
