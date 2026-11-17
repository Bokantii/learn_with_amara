/**
 * Sign-in page message for the `?error=` that Auth.js adds when it redirects
 * to /SignIn (both pages.signIn and pages.error point there in auth.ts).
 * Returns null when there is no error.
 */
export function oauthErrorMessage(error: string | null): string | null {
  if (!error) return null;
  switch (error) {
    case "OAuthAccountNotLinked":
      // The email already has an ICLP account. It is never linked automatically,
      // because that would let a provider account take over an existing one.
      return "This email already has an ICLP account. Please sign in with your email and password.";
    case "AccessDenied":
      // Refused by lib/account/oauth-sign-in.ts: unverified Google email, or an
      // account that is invited or deactivated.
      return "We couldn't sign you in with Google. Use a Google account with a verified email, or sign in with your email and password. If you were invited, use the link in your invitation email.";
    case "AlreadySignedIn":
      // Refused by lib/account/oauth-sign-in.ts so Google is never linked to
      // whoever is currently signed in.
      return "You're already signed in. Sign out first, then continue with Google.";
    default:
      return "Unable to sign in with that provider. Please try again.";
  }
}
