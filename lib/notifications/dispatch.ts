import type { ReactElement } from 'react';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '../prisma';
import { resend, EMAIL_FROM } from '../email';
import {
  MAX_DELIVERY_ATTEMPTS,
  type NotificationChannelValue,
  type NotificationTypeValue,
} from './types';

/**
 * Generic notification dispatch core. Feature code (live classes today;
 * assignments, grading, payments, announcements later) builds a typed request
 * and hands it here — this module owns claiming, per-recipient de-duplication,
 * bounded retry of failed deliveries, channel fan-out, delivery recording and
 * error capture, so no feature reimplements any of it.
 *
 *   feature sender  ->  dispatchNotification({ type, channels, recipients, ... })
 *                         per recipient x channel: claim -> deliver -> record
 */

/** Emails are only actually delivered once a real Resend key replaces the placeholder in lib/email.ts. */
function isEmailDeliveryConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

export interface NotificationRecipientInput {
  /** The user who receives this notification. */
  user: { id: string; name: string; email: string };
  /**
   * Stable, deterministic identity for this one logical notification to this one
   * user. Re-running dispatch with the same key never delivers twice. Keep it
   * under 256 chars (Resend idempotency-key limit) and encode the invalidation
   * boundary in the key (e.g. the class start time) so a changed schedule
   * produces a new key and the obsolete one is simply never generated again.
   */
  dedupeKey: string;
  title: string;
  message: string;
  /** Required when `channels` includes 'EMAIL'. */
  emailMessage?: { subject: string; react: ReactElement };
}

export interface DispatchNotificationInput {
  type: NotificationTypeValue;
  relatedEntityType: string;
  relatedEntityId: string;
  channels: NotificationChannelValue[];
  /** When this notification became due — persisted for the delivery audit trail. */
  scheduledFor?: Date;
  recipients: NotificationRecipientInput[];
}

type ChannelOutcome = 'sent' | 'failed' | 'skipped' | 'already-handled';

export interface ChannelTally {
  sent: number;
  failed: number;
  skipped: number;
  alreadyHandled: number;
}

export interface NotificationRunSummary {
  recipients: number;
  channels: Record<string, ChannelTally>;
}

// Resend allows 10 requests/second per team (429 above that). Cap in-flight
// per-recipient work well under it; also keeps DB write pressure modest.
const SEND_CONCURRENCY = 6;

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workerCount = Math.min(limit, queue.length);
  const workers = Array.from({ length: workerCount }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      await fn(next);
    }
  });
  await Promise.all(workers);
}

/**
 * Dispatch one logical notification to many recipients over one or more
 * channels. Never throws for a per-recipient delivery problem — those are
 * recorded on the row and reflected in the returned tally.
 */
export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<NotificationRunSummary> {
  const summary: NotificationRunSummary = {
    recipients: input.recipients.length,
    channels: {},
  };
  for (const channel of input.channels) {
    summary.channels[channel] = { sent: 0, failed: 0, skipped: 0, alreadyHandled: 0 };
  }

  await mapWithConcurrency(input.recipients, SEND_CONCURRENCY, async (recipient) => {
    for (const channel of input.channels) {
      const outcome = await deliverOne(input, recipient, channel);
      const tally = summary.channels[channel];
      if (outcome === 'sent') tally.sent += 1;
      else if (outcome === 'failed') tally.failed += 1;
      else if (outcome === 'skipped') tally.skipped += 1;
      else tally.alreadyHandled += 1;
    }
  });

  return summary;
}

// Stored failure reasons are a small fixed set — never the raw provider error
// string, which frequently quotes the recipient's email address. Full error
// detail goes to Sentry instead.
const FAIL_NOT_CONFIGURED = 'Email delivery is not configured.';
const FAIL_PROVIDER_REJECTED = 'Email provider rejected the send.';
const FAIL_DELIVERY_ERROR = 'Email delivery failed.';
const FAIL_NO_CONTENT = 'EMAIL channel requested without email content.';

async function deliverOne(
  input: DispatchNotificationInput,
  recipient: NotificationRecipientInput,
  channel: NotificationChannelValue
): Promise<ChannelOutcome> {
  let rowId: string | 'already-handled';
  try {
    rowId = await claimRow(input, recipient, channel);
  } catch (error) {
    Sentry.captureException(error, {
      extra: { where: 'dispatchNotification.claim', type: input.type, channel },
    });
    return 'failed';
  }
  if (rowId === 'already-handled') return 'already-handled';

  // IN_APP has no external provider — the row written at claim time IS the delivery.
  if (channel === 'IN_APP') return 'sent';

  if (!isEmailDeliveryConfigured()) {
    // Not an error: a truthful "we did not send because email isn't wired up".
    await recordStatus(rowId, { status: 'SKIPPED', failureReason: FAIL_NOT_CONFIGURED }, input);
    return 'skipped';
  }

  const emailMessage = recipient.emailMessage;
  if (!emailMessage) {
    await recordFailed(rowId, FAIL_NO_CONTENT, input);
    Sentry.captureException(
      new Error('dispatchNotification: EMAIL channel with no emailMessage'),
      { extra: { type: input.type, relatedEntityId: input.relatedEntityId } }
    );
    return 'failed';
  }

  try {
    const { error } = await resend.emails.send(
      {
        from: EMAIL_FROM,
        to: recipient.user.email,
        subject: emailMessage.subject,
        react: emailMessage.react,
      },
      { idempotencyKey: recipient.dedupeKey }
    );

    if (error) {
      // Log the provider message (may contain PII) only to Sentry, not the DB.
      Sentry.captureException(new Error(`Resend error: ${error.message ?? 'unknown'}`), {
        extra: { where: 'dispatchNotification.send', type: input.type },
      });
      await recordFailed(rowId, FAIL_PROVIDER_REJECTED, input);
      return 'failed';
    }

    await recordStatus(
      rowId,
      { status: 'SENT', sentAt: new Date(), failureReason: null },
      input
    );
    return 'sent';
  } catch (error) {
    Sentry.captureException(error, {
      extra: { where: 'dispatchNotification.send', type: input.type },
    });
    await recordFailed(rowId, FAIL_DELIVERY_ERROR, input);
    return 'failed';
  }
}

/**
 * Persist a delivery outcome. Per the module contract dispatch must not throw
 * for a per-recipient problem — a DB error while recording is captured, not
 * propagated (it would reject the whole concurrency worker otherwise).
 */
async function recordStatus(
  id: string,
  data: {
    status: 'SENT' | 'FAILED' | 'SKIPPED';
    sentAt?: Date;
    failureReason?: string | null;
    attempts?: { increment: number };
  },
  input: DispatchNotificationInput
): Promise<void> {
  try {
    await prisma.notification.update({ where: { id }, data });
  } catch (error) {
    Sentry.captureException(error, {
      extra: { where: 'dispatchNotification.record', type: input.type, id },
    });
  }
}

async function recordFailed(
  id: string,
  reason: string,
  input: DispatchNotificationInput
): Promise<void> {
  await recordStatus(
    id,
    { status: 'FAILED', failureReason: reason, attempts: { increment: 1 } },
    input
  );
}

// A row left in PENDING longer than this was almost certainly orphaned by a
// process that died between claim and record (e.g. a serverless timeout
// mid-batch). Reclaim it rather than leaving that recipient's email wedged
// forever — `idempotencyKey` on the send makes a re-drive safe.
const STALE_PENDING_MS = 10 * 60_000;

/**
 * Claims a delivery slot for (dedupeKey, channel). Returns the row id to deliver
 * on, or 'already-handled' when this logical notification is already sent,
 * skipped, currently in flight, or has exhausted its retry budget.
 *
 * The `@@unique([dedupeKey, channel])` constraint is the concurrency guard: two
 * simultaneous runs race on `create`, the loser catches P2002 and inspects the
 * existing row.
 */
async function claimRow(
  input: DispatchNotificationInput,
  recipient: NotificationRecipientInput,
  channel: NotificationChannelValue
): Promise<string | 'already-handled'> {
  const isInApp = channel === 'IN_APP';
  try {
    const row = await prisma.notification.create({
      data: {
        recipientUserId: recipient.user.id,
        type: input.type,
        title: recipient.title,
        message: recipient.message,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        channel,
        status: isInApp ? 'SENT' : 'PENDING',
        sentAt: isInApp ? new Date() : null,
        dedupeKey: recipient.dedupeKey,
        scheduledFor: input.scheduledFor ?? null,
      },
      select: { id: true },
    });
    return row.id;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  // A row already exists. Retry a prior FAILED attempt that still has budget, or
  // a PENDING row old enough to be considered orphaned. SENT / SKIPPED / fresh
  // PENDING / exhausted are terminal.
  const existing = await prisma.notification.findUnique({
    where: { dedupeKey_channel: { dedupeKey: recipient.dedupeKey, channel } },
    select: { id: true, status: true, attempts: true, updatedAt: true },
  });
  if (!existing) return 'already-handled';

  const retryFailed =
    existing.status === 'FAILED' && existing.attempts < MAX_DELIVERY_ATTEMPTS;
  const reclaimPending =
    existing.status === 'PENDING' &&
    Date.now() - existing.updatedAt.getTime() > STALE_PENDING_MS;

  return retryFailed || reclaimPending ? existing.id : 'already-handled';
}
