import type { GoogleProfile } from 'next-auth/providers/google';
import type { UserStatus } from '../generated/prisma/client';
import { canSignIn } from './status';

/**
 * Server-side gate for OAuth sign-in, called from the Auth.js `signIn`
 * callback in `auth.ts`.
 *
 * Auth.js creates a new ACTIVE user for any OAuth email it hasn't seen before.
 * If the provider hasn't verified that email, anyone could register a
 * victim's address before the victim does. The victim is then locked out:
 * sign-up says "already exists", password reset needs a password, and invites
 * reject an existing email. An admin who records a WhatsApp payment "by email"
 * would also attach it to the wrong person.
 *
 * Rules:
 * - Only providers in OAUTH_PROVIDERS may sign in. Facebook is deliberately
 *   absent: it does not guarantee a verified email.
 * - Google must report `email_verified === true`.
 * - A returning user whose account is INVITED or DEACTIVATED is refused. OAuth
 *   is not an invite-claim path.
 * - Nobody may use OAuth while already signed in. Auth.js would otherwise
 *   LINK the Google account to whoever is signed in (handle-login.js: "If the
 *   user is already signed in ... link the accounts"), so a session left open
 *   on a shared computer could get a stranger's Google account attached to it
 *   for good. ICLP has no account-linking feature; refuse and redirect.
 *
 * An OAuth email that matches an existing credentials account is refused by
 * Auth.js itself (`OAuthAccountNotLinked`), because `auth.ts` never sets
 * `allowDangerousEmailAccountLinking`. Keep it that way.
 */
export const OAUTH_PROVIDERS = ['google'] as const;

/** Where the signIn callback sends an OAuth attempt made while signed in. */
export const ALREADY_SIGNED_IN_REDIRECT = '/SignIn?error=AlreadySignedIn';

export type OAuthSignInInput = {
  provider: string;
  email: string | null | undefined;
  profile: Record<string, unknown> | null | undefined;
  /** True when the request already carries a valid session. */
  alreadySignedIn: boolean;
};

export type FindStatusByEmail = (email: string) => Promise<UserStatus | null>;

export async function isOAuthSignInAllowed(
  input: OAuthSignInInput,
  findStatusByEmail: FindStatusByEmail
): Promise<boolean | typeof ALREADY_SIGNED_IN_REDIRECT> {
  if (input.alreadySignedIn) return ALREADY_SIGNED_IN_REDIRECT;
  if (!(OAUTH_PROVIDERS as readonly string[]).includes(input.provider)) return false;

  const email = input.email?.trim().toLowerCase();
  if (!email) return false;

  if (input.provider === 'google' && input.profile?.email_verified !== true) return false;

  const status = await findStatusByEmail(email);
  if (status !== null && !canSignIn(status)) return false;

  return true;
}

/**
 * Maps Google's ID-token claims to the user Auth.js creates. Same fields as
 * Auth.js's default mapping, with two changes:
 * - The email is trimmed and lowercased, like credentials sign-up and invites.
 *   The adapter's email lookup is case-sensitive, so a mixed-case Google email
 *   would otherwise create a second account next to an existing password
 *   account instead of raising OAuthAccountNotLinked.
 * - A missing name falls back to the email's local part, because `User.name`
 *   is required.
 * Never return a role here: new OAuth users must keep the STUDENT default.
 */
export function googleProfile(p: GoogleProfile) {
  const email = p.email.trim().toLowerCase();
  return {
    id: p.sub,
    name: p.name?.trim() || email.split('@')[0],
    email,
    image: p.picture ?? null,
  };
}
