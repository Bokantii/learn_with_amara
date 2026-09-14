import NextAuth from 'next-auth';
import { CredentialsSignin } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { checkLoginRateLimit, getClientIp } from './lib/rate-limit';
import { canSignIn } from './lib/account/status';

class RateLimitedError extends CredentialsSignin {
  code = 'rate_limited';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    // Credentials sign-in requires JWT sessions — Auth.js cannot create a
    // database session row from the Credentials flow the way it can for OAuth.
    strategy: 'jwt',
  },
  providers: [
    Google,
    Facebook,
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
        const rateLimit = await checkLoginRateLimit(`${ip}:${email.toLowerCase()}`);
        if (!rateLimit.success) {
          throw new RateLimitedError();
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
    signIn: async ({ user, account }) => {
      // Credentials sign-in is already gated in `authorize`. For an OAuth
      // provider, block a returning user whose account has since been archived
      // or is still an unclaimed invite — OAuth is not an invite-claim path.
      if (account?.provider && account.provider !== 'credentials') {
        const email = user?.email?.toLowerCase();
        if (email) {
          const existing = await prisma.user.findUnique({
            where: { email },
            select: { status: true },
          });
          if (existing && !canSignIn(existing.status)) {
            return false;
          }
        }
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
  },
});
