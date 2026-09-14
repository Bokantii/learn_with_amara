import type { UserStatus } from '../generated/prisma/client';

/**
 * Pure account-status helpers — no Prisma / crypto imports, so modules that only
 * need the sign-in gate (`lib/authz.ts`, `auth.ts`) don't pull in the whole
 * `lib/account/lifecycle.ts` graph.
 */

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Only an ACTIVE account may obtain a session. */
export function canSignIn(status: UserStatus): boolean {
  return status === 'ACTIVE';
}
