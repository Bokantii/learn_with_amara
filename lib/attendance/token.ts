import { randomBytes, createHash } from 'crypto';

/**
 * Raw check-in tokens are 256-bit random values, URL-safe base64 encoded, and
 * are returned to the admin exactly once (to build the QR). Only their SHA-256
 * hash is ever persisted (`AttendanceSession.tokenHash`) — the raw token is
 * never stored anywhere, so a database read alone can never reveal a working
 * check-in link.
 *
 * Pure functions — no I/O, no Prisma import — so callers (`lib/attendance/session.ts`
 * for generation, `lib/attendance/checkin.ts` for lookup) can be unit tested
 * without touching a database.
 */

export function generateAttendanceToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('base64url');
  return { rawToken, tokenHash: hashAttendanceToken(rawToken) };
}

export function hashAttendanceToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
