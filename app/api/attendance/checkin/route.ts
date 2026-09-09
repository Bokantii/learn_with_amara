import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { auth } from '../../../../auth';
import { checkInToAttendanceSession, type CheckInFailureReason } from '../../../../lib/attendance/checkin';

export const dynamic = 'force-dynamic';

/**
 * Mobile-ready check-in contract (SPEC §11.10 "Mobile-later compatibility").
 * The future React Native scanner POSTs the scanned token here after the user
 * has authenticated. The web flow uses a server action instead; both funnel
 * into the identical `checkInToAttendanceSession` core so validation semantics
 * never diverge.
 *
 * Auth: NextAuth session (cookie today; a bearer token later). Identity comes
 * only from the session — a `studentUserId` in the body is ignored.
 *
 * CSRF: this is a cookie-authed POST, but a successful check-in also requires
 * the unguessable 256-bit token in the body, which a cross-site attacker cannot
 * obtain. As defence in depth we still reject requests whose `Origin` doesn't
 * match the request host and requests the browser marks `Sec-Fetch-Site:
 * cross-site`.
 */

const STATUS_BY_REASON: Record<CheckInFailureReason, number> = {
  RATE_LIMITED: 429,
  ALREADY_CHECKED_IN: 409,
  NOT_ENTITLED: 403,
  CLASS_NOT_ELIGIBLE: 409,
  INVALID_OR_EXPIRED: 400,
};

function isCrossSite(request: NextRequest): boolean {
  // Browsers set this on every request; only same-origin / direct navigation are
  // acceptable for a state-changing call. `same-site` and `cross-site` are not.
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return true;
  }

  const origin = request.headers.get('origin');
  if (origin) {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const expectedHost = configured
      ? safeHost(configured)
      : request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    try {
      if (new URL(origin).host !== expectedHost) return true;
    } catch {
      return true;
    }
  }
  return false;
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (isCrossSite(request)) {
    return NextResponse.json({ ok: false, error: 'Cross-site request rejected.' }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
  }

  let token: unknown;
  try {
    const body = await request.json();
    token = body?.token;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 512) {
    return NextResponse.json({ ok: false, error: 'Missing or invalid "token".' }, { status: 400 });
  }

  try {
    const result = await checkInToAttendanceSession({
      rawToken: token,
      studentUserId: session.user.id,
    });

    if (result.ok) {
      return NextResponse.json({ ok: true, status: result.status, checkedInAt: result.checkedInAt.toISOString() });
    }
    return NextResponse.json(
      { ok: false, reason: result.reason, existingStatus: result.existingStatus ?? null },
      { status: STATUS_BY_REASON[result.reason] }
    );
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'api/attendance/checkin' } });
    return NextResponse.json({ ok: false, error: 'Check-in failed.' }, { status: 500 });
  }
}
