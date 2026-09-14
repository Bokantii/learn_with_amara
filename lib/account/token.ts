import { randomBytes, createHash } from 'crypto';

/**
 * Raw invite / password-reset tokens are 256-bit random values, URL-safe base64
 * encoded, and are handed out exactly once — inside the emailed link (or, when
 * email is unconfigured, shown once to the admin who created the account). Only
 * the SHA-256 hash is ever persisted (`AccountToken.tokenHash`), so a database
 * read alone can never mint a working activation / reset link.
 *
 * Pure functions — no I/O, no Prisma import — so `lib/account/lifecycle.ts` can
 * be unit tested without a database (mirrors `lib/attendance/token.ts`).
 */

export function generateAccountToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('base64url');
  return { rawToken, tokenHash: hashAccountToken(rawToken) };
}

export function hashAccountToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
