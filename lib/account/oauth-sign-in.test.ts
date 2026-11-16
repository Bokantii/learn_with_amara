import { describe, it, expect, vi } from 'vitest';
import type { GoogleProfile } from 'next-auth/providers/google';
import {
  ALREADY_SIGNED_IN_REDIRECT,
  googleProfile,
  isOAuthSignInAllowed,
  type FindStatusByEmail,
} from './oauth-sign-in';

const verifiedGoogle = { email_verified: true };

function lookup(status: Awaited<ReturnType<FindStatusByEmail>>) {
  return vi.fn<FindStatusByEmail>().mockResolvedValue(status);
}

describe('isOAuthSignInAllowed', () => {
  it('allows a new user with a verified Google email', async () => {
    const find = lookup(null);
    await expect(
      isOAuthSignInAllowed({ provider: 'google', email: 'new@gmail.com', profile: verifiedGoogle, alreadySignedIn: false }, find)
    ).resolves.toBe(true);
  });

  it('allows a returning ACTIVE user with a verified Google email', async () => {
    await expect(
      isOAuthSignInAllowed(
        { provider: 'google', email: 'aisha@gmail.com', profile: verifiedGoogle, alreadySignedIn: false },
        lookup('ACTIVE')
      )
    ).resolves.toBe(true);
  });

  it.each([
    ['false', { email_verified: false }],
    ['missing', {}],
    ['the string "true"', { email_verified: 'true' }],
    ['no profile', null],
  ])('refuses Google when email_verified is %s', async (_label, profile) => {
    const find = lookup(null);
    await expect(
      isOAuthSignInAllowed({ provider: 'google', email: 'victim@example.org', profile, alreadySignedIn: false }, find)
    ).resolves.toBe(false);
    expect(find).not.toHaveBeenCalled();
  });

  it('refuses Facebook even with a verified-looking profile', async () => {
    const find = lookup(null);
    await expect(
      isOAuthSignInAllowed(
        { provider: 'facebook', email: 'victim@example.org', profile: { email_verified: true }, alreadySignedIn: false },
        find
      )
    ).resolves.toBe(false);
    expect(find).not.toHaveBeenCalled();
  });

  it('refuses an unknown provider', async () => {
    await expect(
      isOAuthSignInAllowed({ provider: 'github', email: 'a@b.com', profile: verifiedGoogle, alreadySignedIn: false }, lookup(null))
    ).resolves.toBe(false);
  });

  it.each([undefined, null, '', '   '])('refuses a missing email (%s)', async (email) => {
    await expect(
      isOAuthSignInAllowed({ provider: 'google', email, profile: verifiedGoogle, alreadySignedIn: false }, lookup(null))
    ).resolves.toBe(false);
  });

  it.each(['INVITED', 'DEACTIVATED'] as const)('refuses a returning %s user', async (status) => {
    await expect(
      isOAuthSignInAllowed(
        { provider: 'google', email: 'someone@gmail.com', profile: verifiedGoogle, alreadySignedIn: false },
        lookup(status)
      )
    ).resolves.toBe(false);
  });

  it('refuses (redirects) while someone is already signed in, so Google is never linked to their account', async () => {
    const find = lookup(null);
    await expect(
      isOAuthSignInAllowed(
        { provider: 'google', email: 'stranger@gmail.com', profile: verifiedGoogle, alreadySignedIn: true },
        find
      )
    ).resolves.toBe(ALREADY_SIGNED_IN_REDIRECT);
    expect(find).not.toHaveBeenCalled();
  });

  it('looks the account up by trimmed, lowercased email', async () => {
    const find = lookup('DEACTIVATED');
    await expect(
      isOAuthSignInAllowed(
        { provider: 'google', email: '  Someone@Gmail.COM ', profile: verifiedGoogle, alreadySignedIn: false },
        find
      )
    ).resolves.toBe(false);
    expect(find).toHaveBeenCalledWith('someone@gmail.com');
  });
});

describe('auth.ts OAuth configuration guard', () => {
  // These are source checks, not behaviour tests. Auth.js refuses to link an
  // OAuth email to an existing account (OAuthAccountNotLinked) only while
  // dangerous linking is off, and Facebook must stay unregistered until it
  // verifies emails. Fail loudly if either is changed.
  it('never enables dangerous email account linking and does not register Facebook', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const source = readFileSync(join(process.cwd(), 'auth.ts'), 'utf8');
    expect(source).not.toMatch(/allowDangerousEmailAccountLinking/);
    expect(source).not.toMatch(/providers\/facebook/);
  });
});

describe('googleProfile', () => {
  const base = { sub: 'google-123', email: 'jane@gmail.com', name: 'Jane Doe', picture: 'https://img/p.png' };
  const claims = (overrides: Record<string, unknown> = {}) => ({ ...base, ...overrides }) as unknown as GoogleProfile;

  it('maps only id, name, email and image (never a role)', () => {
    expect(googleProfile(claims({ role: 'ADMIN', email_verified: true }))).toEqual({
      id: 'google-123',
      name: 'Jane Doe',
      email: 'jane@gmail.com',
      image: 'https://img/p.png',
    });
  });

  it('lowercases and trims the email', () => {
    expect(googleProfile(claims({ email: '  Jane.Doe@Company.COM ' })).email).toBe('jane.doe@company.com');
  });

  it.each([undefined, '', '   '])('falls back to the email local part when the name is %j', (name) => {
    expect(googleProfile(claims({ name, email: 'Jane.Doe@Company.com' })).name).toBe('jane.doe');
  });

  it('maps a missing picture to null', () => {
    expect(googleProfile(claims({ picture: undefined })).image).toBeNull();
  });
});
