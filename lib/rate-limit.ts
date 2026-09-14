import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiting needs a real Upstash Redis instance to work. Locally (and in
// any environment where UPSTASH_REDIS_REST_URL/TOKEN aren't set) we degrade
// gracefully to "always allow" rather than crashing the app or blocking auth
// entirely — matching the placeholder-fallback pattern used for Stripe/Resend/
// Blob elsewhere in this codebase.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

if (!redis && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled (all requests allowed).'
  );
}

const loginLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'ratelimit:login' })
  : null;

const signUpLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '60 s'), prefix: 'ratelimit:signup' })
  : null;

const newsletterLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'ratelimit:newsletter' })
  : null;

const attendanceCheckInLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      prefix: 'ratelimit:attendance-checkin',
    })
  : null;

const assessmentAttemptLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'ratelimit:assessment-attempt',
    })
  : null;

const passwordResetLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 s'),
      prefix: 'ratelimit:pwreset',
    })
  : null;

const inviteAcceptLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'ratelimit:invite-accept',
    })
  : null;

/** Whether a real Upstash backend is wired up. When false, every `check()` allows. */
export const rateLimitConfigured = redis != null;

export type RateLimitResult = { success: boolean; remaining: number; reset: number };

async function check(limiter: Ratelimit | null, key: string): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, remaining: Infinity, reset: 0 };
  }
  const result = await limiter.limit(key);
  return { success: result.success, remaining: result.remaining, reset: result.reset };
}

export function checkLoginRateLimit(key: string) {
  return check(loginLimiter, key);
}

export function checkSignUpRateLimit(key: string) {
  return check(signUpLimiter, key);
}

export function checkNewsletterRateLimit(key: string) {
  return check(newsletterLimiter, key);
}

export function checkAttendanceCheckInRateLimit(key: string) {
  return check(attendanceCheckInLimiter, key);
}

/** Limits how often a user can start a fresh assessment attempt. */
export function checkAssessmentAttemptRateLimit(key: string) {
  return check(assessmentAttemptLimiter, key);
}

/** Limits password-reset requests (keyed by IP + email) — throttles enumeration probing. */
export function checkPasswordResetRateLimit(key: string) {
  return check(passwordResetLimiter, key);
}

/** Limits invite / reset token submissions (keyed by IP) — throttles token guessing. */
export function checkInviteAcceptRateLimit(key: string) {
  return check(inviteAcceptLimiter, key);
}

export function getClientIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return requestHeaders.get('x-real-ip') ?? 'unknown';
}
