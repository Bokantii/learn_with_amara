import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '../../../../lib/prisma';
import { sendLiveClassReminder } from '../../../../lib/notifications/liveclass';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Every SCHEDULED class starting within this many minutes is (re)processed on
// each tick. Sized to fully cover the external scheduler's cadence *and its
// jitter* (.github/workflows/live-class-reminders.yml runs ~*/10, but GitHub
// Actions schedules can be delayed well past that) so a class's window can
// never fall between two ticks. Re-processing a class on consecutive ticks is
// free: per-recipient dedupe keys (keyed to the class's current startsAt) make
// repeat claims a no-op, and dispatch's bounded retry re-drives only rows that
// previously FAILED or wedged in PENDING.
const LEAD_WINDOW_MINUTES = 70;

function isAuthorized(request: NextRequest): boolean {
  // Fail closed: no CRON_SECRET configured => every call is rejected, never open.
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const windowEnd = new Date(now + LEAD_WINDOW_MINUTES * 60_000);

  const dueClasses = await prisma.liveClass.findMany({
    where: {
      status: 'SCHEDULED',
      startsAt: { gte: new Date(now), lte: windowEnd },
    },
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let alreadyHandled = 0;
  let classErrors = 0;

  for (const { id } of dueClasses) {
    try {
      const summary = await sendLiveClassReminder(id);
      const email = summary?.channels.EMAIL;
      if (email) {
        sent += email.sent;
        failed += email.failed;
        skipped += email.skipped;
        alreadyHandled += email.alreadyHandled;
      }
    } catch (error) {
      Sentry.captureException(error, { extra: { liveClassId: id } });
      classErrors += 1;
    }
  }

  const summary = {
    classesProcessed: dueClasses.length,
    sent,
    failed,
    skipped,
    alreadyHandled,
    classErrors,
  };
  // Full detail stays in the server log; the HTTP response discloses nothing.
  console.log('[cron:live-class-reminders]', JSON.stringify(summary));
  return NextResponse.json({ ok: true });
}
