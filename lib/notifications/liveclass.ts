import { prisma } from '../prisma';
import { DEFAULT_MEETING_URL, CANCELLATION_REASON_LABEL } from '../liveclass';
import { resolveLiveClassRecipients } from './recipients';
import { dispatchNotification, type NotificationRunSummary } from './dispatch';
import LiveClassReminderEmail from '../../emails/LiveClassReminderEmail';
import LiveClassCancelledEmail from '../../emails/LiveClassCancelledEmail';
import LiveClassRescheduledEmail from '../../emails/LiveClassRescheduledEmail';

/**
 * Live Classes — the first production consumer of the notification system.
 * Each function is a thin caller of `dispatchNotification`: it re-reads the
 * authoritative LiveClass record, re-checks the class is still eligible for this
 * message, resolves the currently-entitled recipients (never a captured list),
 * builds copy + dedupe keys, and delegates all delivery mechanics to dispatch.
 */

function formatUtc(date: Date): string {
  return (
    date.toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }) + ' UTC'
  );
}

function durationMinutes(startsAt: Date, endsAt: Date): number {
  return Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
}

async function fetchLiveClass(liveClassId: string) {
  return prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: { program: true, group: true },
  });
}

const RELATED_ENTITY_TYPE = 'LiveClass';

/**
 * Reminder for a class about to start. The caller (scheduler) only invokes this
 * for classes it believes are due, but this re-verifies status against the live
 * record — a stale job must always defer to the current LiveClass, never the
 * data it was queued with.
 */
export async function sendLiveClassReminder(
  liveClassId: string
): Promise<NotificationRunSummary | null> {
  const liveClass = await fetchLiveClass(liveClassId);
  if (!liveClass || liveClass.status !== 'SCHEDULED') return null;

  const recipients = await resolveLiveClassRecipients(liveClass);
  if (recipients.length === 0) {
    return { recipients: 0, channels: {} };
  }

  const startsAtKey = liveClass.startsAt.toISOString();
  const whenFormatted = formatUtc(liveClass.startsAt);
  const meetingUrl = liveClass.meetingUrl ?? DEFAULT_MEETING_URL;
  const duration = durationMinutes(liveClass.startsAt, liveClass.endsAt);
  const title = `"${liveClass.title}" starts soon`;
  const message = `Starts at ${whenFormatted}. Instructor: ${liveClass.instructorName}.`;

  return dispatchNotification({
    type: 'CLASS_REMINDER',
    relatedEntityType: RELATED_ENTITY_TYPE,
    relatedEntityId: liveClass.id,
    channels: ['IN_APP', 'EMAIL'],
    scheduledFor: liveClass.startsAt,
    recipients: recipients.map((recipient) => ({
      user: recipient,
      // startsAt in the key: a reschedule yields a new key, so the obsolete
      // reminder can never be (re)sent and a fresh one is allowed.
      dedupeKey: `CLASS_REMINDER:${liveClass.id}:${startsAtKey}:${recipient.id}`,
      title,
      message,
      emailMessage: {
        subject: `Reminder: ${liveClass.title} starts soon`,
        react: LiveClassReminderEmail({
          studentName: recipient.name,
          classTitle: liveClass.title,
          programName: liveClass.program.name,
          groupName: liveClass.group?.name,
          instructorName: liveClass.instructorName,
          whenFormatted,
          durationMinutes: duration,
          meetingUrl,
          description: liveClass.description,
        }),
      },
    })),
  });
}

export async function sendLiveClassCancellation(
  liveClassId: string
): Promise<NotificationRunSummary | null> {
  const liveClass = await fetchLiveClass(liveClassId);
  if (!liveClass || liveClass.status !== 'CANCELLED') return null;

  const recipients = await resolveLiveClassRecipients(liveClass);
  if (recipients.length === 0) {
    return { recipients: 0, channels: {} };
  }

  const whenFormatted = formatUtc(liveClass.startsAt);
  const reasonLabel = liveClass.cancellationReason
    ? CANCELLATION_REASON_LABEL[
        liveClass.cancellationReason as keyof typeof CANCELLATION_REASON_LABEL
      ]
    : 'Not specified';
  const title = `"${liveClass.title}" was cancelled`;
  const message = liveClass.cancellationMessage
    ? `${reasonLabel}. ${liveClass.cancellationMessage}`
    : reasonLabel;

  return dispatchNotification({
    type: 'CLASS_CANCELLED',
    relatedEntityType: RELATED_ENTITY_TYPE,
    relatedEntityId: liveClass.id,
    channels: ['IN_APP', 'EMAIL'],
    scheduledFor: new Date(),
    recipients: recipients.map((recipient) => ({
      user: recipient,
      // No time component: cancelling the same class twice is a no-op.
      dedupeKey: `CLASS_CANCELLED:${liveClass.id}:${recipient.id}`,
      title,
      message,
      emailMessage: {
        subject: `Cancelled: ${liveClass.title}`,
        react: LiveClassCancelledEmail({
          studentName: recipient.name,
          classTitle: liveClass.title,
          programName: liveClass.program.name,
          groupName: liveClass.group?.name,
          whenFormatted,
          reasonLabel,
          customMessage: liveClass.cancellationMessage,
        }),
      },
    })),
  });
}

export async function sendLiveClassReschedule(
  liveClassId: string
): Promise<NotificationRunSummary | null> {
  const liveClass = await fetchLiveClass(liveClassId);
  if (!liveClass || liveClass.status !== 'SCHEDULED' || !liveClass.rescheduledAt) return null;

  const recipients = await resolveLiveClassRecipients(liveClass);
  if (recipients.length === 0) {
    return { recipients: 0, channels: {} };
  }

  const rescheduledAtKey = liveClass.rescheduledAt.toISOString();
  const newWhenFormatted = formatUtc(liveClass.startsAt);
  const meetingUrl = liveClass.meetingUrl ?? DEFAULT_MEETING_URL;
  const title = `"${liveClass.title}" was rescheduled`;
  const message = `New time: ${newWhenFormatted}`;

  return dispatchNotification({
    type: 'CLASS_RESCHEDULED',
    relatedEntityType: RELATED_ENTITY_TYPE,
    relatedEntityId: liveClass.id,
    channels: ['IN_APP', 'EMAIL'],
    scheduledFor: new Date(),
    recipients: recipients.map((recipient) => ({
      user: recipient,
      // rescheduledAt in the key: every genuine schedule move notifies once.
      dedupeKey: `CLASS_RESCHEDULED:${liveClass.id}:${rescheduledAtKey}:${recipient.id}`,
      title,
      message,
      emailMessage: {
        subject: `Rescheduled: ${liveClass.title}`,
        react: LiveClassRescheduledEmail({
          studentName: recipient.name,
          classTitle: liveClass.title,
          programName: liveClass.program.name,
          groupName: liveClass.group?.name,
          newWhenFormatted,
          meetingUrl,
        }),
      },
    })),
  });
}
