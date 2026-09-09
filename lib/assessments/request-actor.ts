import { cookies } from 'next/headers';
import { getSessionUser } from '../authz';
import { PLACEMENT_CLAIM_COOKIE } from './constants';
import { hashClaimToken, type AttemptActor } from './ownership';

/**
 * Resolve the current request's attempt actor from the session **and/or** the
 * httpOnly `placement_attempt` claim cookie. Server-only (reads `next/headers`).
 * Used by the placement pages and actions so ownership is decided identically
 * everywhere.
 */
export async function getRequestActor(): Promise<AttemptActor> {
  const user = await getSessionUser();
  const raw = (await cookies()).get(PLACEMENT_CLAIM_COOKIE)?.value ?? null;
  return {
    userId: user?.id ?? null,
    claimTokenHash: raw ? hashClaimToken(raw) : null,
  };
}
