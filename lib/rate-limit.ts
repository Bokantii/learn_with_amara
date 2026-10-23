import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import { resolveUpstashCredentials } from './upstash-credentials.mjs';

/**
 * Rate limiting for sensitive public/auth mutations (SPEC #11).
 *
 * Credentials: a complete URL + token pair from one scheme —
 * `UPSTASH_REDIS_REST_URL`/`_TOKEN` or `KV_REST_API_URL`/`_TOKEN` (Vercel
 * Marketplace naming). Pairs are never mixed; see lib/upstash-credentials.mjs.
 *
 * Behaviour by environment:
 * - **Upstash configured**: limits are enforced globally in Redis.
 * - **Upstash configured but failing** (error or slower than
 *   `UPSTASH_TIMEOUT_MS`): the same window is enforced by an in-memory
 *   fallback and the outage is reported. This protection is **per server
 *   instance only, not globally consistent**: each instance counts separately
 *   and counts reset on cold start, so an attacker spread across N instances
 *   gets up to N× the limit. Chosen so a short Upstash outage doesn't lock
 *   every student out of sign-in or check-in. The library's own timeout would
 *   otherwise *allow* the request.
 * - **Credentials missing or incomplete in production**: a configuration
 *   failure. Every check fails closed (`reason: 'unavailable'`) and is
 *   reported. The production Vercel build also refuses to run
 *   (scripts/check-production-env.mjs).
 * - **Missing or incomplete in dev/test**: disabled — every check allows.
 *
 * Mode is resolved lazily on first use so importing this module never throws
 * (e.g. during `next build` page-data collection or CI).
 */

const UPSTASH_TIMEOUT_MS = 1500;
const FALLBACK_MAX_KEYS = 10_000;
const OUTAGE_REPORT_INTERVAL_MS = 60_000;

type Spec = { prefix: string; tokens: number; windowSeconds: number };

const LIMITS = {
  loginIpAccount: { prefix: 'ratelimit:login', tokens: 5, windowSeconds: 60 },
  loginAccount: { prefix: 'ratelimit:login-account', tokens: 20, windowSeconds: 15 * 60 },
  signUpIp: { prefix: 'ratelimit:signup', tokens: 3, windowSeconds: 60 },
  signUpIpHourly: { prefix: 'ratelimit:signup-ip-hour', tokens: 10, windowSeconds: 60 * 60 },
  signUpAccount: { prefix: 'ratelimit:signup-account', tokens: 3, windowSeconds: 60 * 60 },
  resetRequestIpAccount: { prefix: 'ratelimit:pwreset', tokens: 3, windowSeconds: 60 },
  resetRequestIp: { prefix: 'ratelimit:pwreset-ip', tokens: 10, windowSeconds: 15 * 60 },
  resetRequestAccount: { prefix: 'ratelimit:pwreset-account', tokens: 5, windowSeconds: 60 * 60 },
  resetComplete: { prefix: 'ratelimit:pwreset-complete', tokens: 5, windowSeconds: 60 },
  inviteAccept: { prefix: 'ratelimit:invite-accept', tokens: 5, windowSeconds: 60 },
  // A class usually shares one Wi-Fi IP, so the IP cap is deliberately generous;
  // the per-student cap is the real throttle.
  checkInStudent: { prefix: 'ratelimit:attendance-checkin', tokens: 10, windowSeconds: 60 },
  checkInIp: { prefix: 'ratelimit:attendance-checkin-ip', tokens: 120, windowSeconds: 60 },
  newsletter: { prefix: 'ratelimit:newsletter', tokens: 5, windowSeconds: 60 },
  assessmentAttempt: { prefix: 'ratelimit:assessment-attempt', tokens: 5, windowSeconds: 60 },
} satisfies Record<string, Spec>;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Epoch ms when the window frees up (0 when unknown/irrelevant). */
  reset: number;
  /** Why a request was denied: over the limit, or the limiter can't be trusted. */
  reason?: 'limited' | 'unavailable';
  retryAfterSeconds?: number;
};

type Mode = { kind: 'upstash'; redis: Redis } | { kind: 'misconfigured' } | { kind: 'disabled' };

let mode: Mode | null = null;
const upstashLimiters = new Map<string, Ratelimit>();
const fallbackHits = new Map<string, number[]>();
let misconfigDetail = '';
let misconfigReported = false;
let lastOutageReport = 0;

function resolveMode(): Mode {
  if (mode) return mode;
  const credentials = resolveUpstashCredentials(process.env);
  if (credentials.status === 'ok') {
    if (credentials.conflict) {
      console.warn(
        '[rate-limit] Both UPSTASH_REDIS_REST_* and KV_REST_API_* are set with different values — using UPSTASH_REDIS_REST_*.'
      );
    }
    mode = { kind: 'upstash', redis: new Redis({ url: credentials.url, token: credentials.token }) };
    return mode;
  }

  // Names only, never values.
  misconfigDetail =
    credentials.status === 'incomplete'
      ? `credentials incomplete (${credentials.problems.join('; ')})`
      : 'UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN) not set';
  if (process.env.NODE_ENV === 'production') {
    mode = { kind: 'misconfigured' };
  } else {
    if (process.env.NODE_ENV !== 'test' || credentials.status === 'incomplete') {
      console.warn(`[rate-limit] ${misconfigDetail} — rate limiting is disabled outside production.`);
    }
    mode = { kind: 'disabled' };
  }
  return mode;
}

function upstashLimiter(redis: Redis, spec: Spec): Ratelimit {
  let limiter = upstashLimiters.get(spec.prefix);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(spec.tokens, `${spec.windowSeconds} s`),
      prefix: spec.prefix,
      timeout: UPSTASH_TIMEOUT_MS,
    });
    upstashLimiters.set(spec.prefix, limiter);
  }
  return limiter;
}

function retryAfter(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

function denied(reason: 'limited' | 'unavailable', reset: number): RateLimitResult {
  return { success: false, remaining: 0, reset, reason, retryAfterSeconds: retryAfter(reset) };
}

/**
 * Sliding window used only while Upstash is unreachable. Per-instance memory:
 * bounded protection, not a global limit (see the module comment).
 */
function fallbackCheck(spec: Spec, key: string): RateLimitResult {
  const now = Date.now();
  const windowMs = spec.windowSeconds * 1000;
  const bucket = `${spec.prefix}:${key}`;
  const hits = (fallbackHits.get(bucket) ?? []).filter((t) => t > now - windowMs);

  if (hits.length >= spec.tokens) {
    fallbackHits.set(bucket, hits);
    return denied('limited', hits[0] + windowMs);
  }

  hits.push(now);
  fallbackHits.delete(bucket); // re-insert so Map order tracks recency
  fallbackHits.set(bucket, hits);
  while (fallbackHits.size > FALLBACK_MAX_KEYS) {
    const oldest = fallbackHits.keys().next().value;
    if (oldest === undefined) break;
    fallbackHits.delete(oldest);
  }
  return { success: true, remaining: spec.tokens - hits.length, reset: hits[0] + windowMs };
}

function reportMisconfigured() {
  if (misconfigReported) return;
  misconfigReported = true;
  const message = `[rate-limit] Upstash ${misconfigDetail} in production — sensitive requests are being refused.`;
  console.error(message);
  Sentry.captureMessage(message, 'error');
}

function reportOutage(prefix: string, cause: 'timeout' | 'error', error?: unknown) {
  const now = Date.now();
  if (now - lastOutageReport < OUTAGE_REPORT_INTERVAL_MS) return;
  lastOutageReport = now;
  // Never include the key: it can contain an email address or IP.
  const message = `[rate-limit] Upstash ${cause} on ${prefix} — using in-memory fallback limits.`;
  console.warn(message, error instanceof Error ? error.message : '');
  Sentry.captureMessage(message, 'warning');
}

async function check(spec: Spec, key: string): Promise<RateLimitResult> {
  const m = resolveMode();
  if (m.kind === 'disabled') {
    return { success: true, remaining: Infinity, reset: 0 };
  }
  if (m.kind === 'misconfigured') {
    reportMisconfigured();
    return denied('unavailable', Date.now() + 60_000);
  }

  try {
    const result = await upstashLimiter(m.redis, spec).limit(key);
    if (result.reason === 'timeout') {
      reportOutage(spec.prefix, 'timeout');
      return fallbackCheck(spec, key);
    }
    return result.success
      ? { success: true, remaining: result.remaining, reset: result.reset }
      : denied('limited', result.reset);
  } catch (error) {
    reportOutage(spec.prefix, 'error', error);
    return fallbackCheck(spec, key);
  }
}

/** Runs every check; denies if any denies (`unavailable` wins over `limited`). */
async function checkAll(checks: [Spec, string][]): Promise<RateLimitResult> {
  const results = await Promise.all(checks.map(([spec, key]) => check(spec, key)));
  const failures = results.filter((r) => !r.success);
  if (failures.length === 0) {
    return {
      success: true,
      remaining: Math.min(...results.map((r) => r.remaining)),
      reset: Math.max(...results.map((r) => r.reset)),
    };
  }
  const reason = failures.some((r) => r.reason === 'unavailable') ? 'unavailable' : 'limited';
  return denied(reason, Math.max(...failures.map((r) => r.reset)));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Credentials sign-in: per IP+account, plus per account across all IPs. */
export function checkLoginRateLimit({ ip, email }: { ip: string; email: string }) {
  const account = normalizeEmail(email);
  return checkAll([
    [LIMITS.loginIpAccount, `${ip}:${account}`],
    [LIMITS.loginAccount, account],
  ]);
}

export function checkSignUpRateLimit({ ip, email }: { ip: string; email: string }) {
  return checkAll([
    [LIMITS.signUpIp, ip],
    [LIMITS.signUpIpHourly, ip],
    [LIMITS.signUpAccount, normalizeEmail(email)],
  ]);
}

/** Password-reset *requests* — callers must keep the response neutral when limited. */
export function checkPasswordResetRequestRateLimit({ ip, email }: { ip: string; email: string }) {
  const account = normalizeEmail(email);
  return checkAll([
    [LIMITS.resetRequestIpAccount, `${ip}:${account}`],
    [LIMITS.resetRequestIp, ip],
    [LIMITS.resetRequestAccount, account],
  ]);
}

/** Password-reset *completion* (token submission) — throttles token guessing. */
export function checkPasswordResetCompleteRateLimit(ip: string) {
  return check(LIMITS.resetComplete, ip);
}

/** Invite acceptance (token submission) — throttles token guessing. */
export function checkInviteAcceptRateLimit(ip: string) {
  return check(LIMITS.inviteAccept, ip);
}

export function checkAttendanceCheckInRateLimit({
  studentUserId,
  ip,
}: {
  studentUserId: string;
  ip: string;
}) {
  return checkAll([
    [LIMITS.checkInStudent, studentUserId],
    [LIMITS.checkInIp, ip],
  ]);
}

export function checkNewsletterRateLimit(ip: string) {
  return check(LIMITS.newsletter, ip);
}

/** Limits how often a user (or anonymous IP) can start a fresh assessment attempt. */
export function checkAssessmentAttemptRateLimit(key: string) {
  return check(LIMITS.assessmentAttempt, key);
}

/** Safe, generic user-facing message for a denied check. */
export function rateLimitMessage(reason: RateLimitResult['reason']): string {
  return reason === 'unavailable'
    ? 'This is temporarily unavailable. Please try again shortly.'
    : 'Too many attempts. Please wait a minute and try again.';
}

/**
 * Client IP for rate-limit keys. On Vercel, `x-real-ip` / `x-forwarded-for` are
 * set by the platform (client-supplied values are overwritten), so they can be
 * trusted. Anywhere else they are attacker-controlled, so they are ignored —
 * limits then fall back to the account/student keys.
 */
export function getClientIp(requestHeaders: Headers): string {
  if (!process.env.VERCEL) return 'unknown';
  const realIp = requestHeaders.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}
