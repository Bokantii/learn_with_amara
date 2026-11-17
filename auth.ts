import NextAuth from 'next-auth';
import { CredentialsSignin } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { checkLoginRateLimit, getClientIp } from './lib/rate-limit';
import { canSignIn } from './lib/account/status';
import { googleProfile, isOAuthSignInAllowed } from './lib/account/oauth-sign-in';

class RateLimitedError extends CredentialsSignin {
  code = 'rate_limited';
}

/** The rate limiter can't be trusted (missing production config) — refuse. */
class RateLimitUnavailableError extends CredentialsSignin {
  code = 'unavailable';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    // Credentials sign-in requires JWT sessions — Auth.js cannot create a
    // database session row from the Credentials flow the way it can for OAuth.
    strategy: 'jwt',
  },
  providers: [
    // Google is registered only when its keys are configured, so a missing key
    // hides the button (components/SocialSignInButtons) instead of showing one
    // that fails. Facebook is deliberately not registered: it does not
    // guarantee a verified email (see lib/account/oauth-sign-in.ts).
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google({ profile: googleProfile })] : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null;
        }

        const ip = getClientIp(request.headers);
        const rateLimit = await checkLoginRateLimit({ ip, email });
        if (!rateLimit.success) {
          throw rateLimit.reason === 'unavailable'
            ? new RateLimitUnavailableError()
            : new RateLimitedError();
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // An invited-but-not-activated or deactivated account never gets a session.
        if (!canSignIn(user.status)) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Credentials sign-in is already gated in `authorize`. Every OAuth
      // sign-in must pass the provider / verified-email / account-status rules.
      if (account?.provider && account.provider !== 'credentials') {
        // `auth()` reads the session cookie of this same callback request.
        const alreadySignedIn = Boolean((await auth())?.user);
        return isOAuthSignInAllowed(
          { provider: account.provider, email: user?.email, profile, alreadySignedIn },
          async (email) =>
            (await prisma.user.findUnique({ where: { email }, select: { status: true } }))?.status ??
            null
        );
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role;
        session.user.tokenIssuedAt = typeof token.iat === 'number' ? token.iat : undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/SignIn',
    // A refused OAuth sign-in (AccessDenied) would otherwise land on the bare
    // Auth.js error page; send it to /SignIn, which explains it.
    error: '/SignIn',
  },
});
