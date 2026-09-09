import { randomBytes, createHash } from 'crypto';

/**
 * Attempt ownership (SPEC §19). A signed-in student owns an attempt via `userId`.
 * An anonymous public-placement attempt is owned via a 256-bit claim token whose
 * SHA-256 hex is stored in `AssessmentAttempt.claimTokenHash`; the raw token
 * lives only in an httpOnly cookie on the taker's browser. The `attemptId` in a
 * URL is a cuid, never the secret — access always requires a matching `userId`
 * session or the matching claim-token cookie.
 */

export function hashClaimToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateClaimToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashClaimToken(raw) };
}

export interface AttemptActor {
  /** the signed-in user's id, or null for an anonymous visitor */
  userId: string | null;
  /** sha256 of the claim-token cookie, or null when there is no such cookie */
  claimTokenHash: string | null;
}

export function ownsAttempt(
  attempt: { userId: string | null; claimTokenHash: string | null },
  actor: AttemptActor
): boolean {
  if (actor.userId != null && attempt.userId != null && actor.userId === attempt.userId) {
    return true;
  }
  if (
    actor.claimTokenHash != null &&
    attempt.claimTokenHash != null &&
    actor.claimTokenHash === attempt.claimTokenHash
  ) {
    return true;
  }
  return false;
}
