import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** Sign-up throttling (#11): a denied request creates no account. */

const rate = vi.fn();
const userCreate = vi.fn();

const welcomeEmail = vi.fn((props: unknown) => {
  void props;
  return null;
});
let requestHeaders = new Headers();

vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('../../lib/rate-limit', async (orig) => ({
  ...(await orig<typeof import('../../lib/rate-limit')>()),
  checkSignUpRateLimit: (...a: unknown[]) => rate(...a),
}));
vi.mock('../../lib/prisma', () => ({
  prisma: { user: { findUnique: async () => null, create: (...a: unknown[]) => userCreate(...a) } },
}));
vi.mock('../../lib/email', () => ({ resend: { emails: { send: async () => ({}) } }, EMAIL_FROM: 'x' }));
vi.mock('../../lib/authz', () => ({ getSessionUser: vi.fn() }));
vi.mock('../../emails/WelcomeEmail', () => ({ default: (props: unknown) => welcomeEmail(props) }));

import { signUpAction } from './actions';

const input = { firstName: 'A', lastName: 'B', email: 'New@X.com', password: 'longenough' };

beforeEach(() => vi.clearAllMocks());

describe('signUpAction rate limiting', () => {
  it('keys the check by IP and the submitted email', async () => {
    rate.mockResolvedValue({ success: true, remaining: 1, reset: 0 });
    await signUpAction(input);
    expect(rate).toHaveBeenCalledWith({ ip: 'unknown', email: 'New@X.com' });
    expect(userCreate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['limited', /Too many sign-up attempts/],
    ['unavailable', /temporarily unavailable/],
  ])('%s: user-visible message, no account created', async (reason, message) => {
    rate.mockResolvedValue({ success: false, remaining: 0, reset: 0, reason });
    const res = await signUpAction(input);
    expect(res?.serverError).toMatch(message);
    expect(userCreate).not.toHaveBeenCalled();
  });
});

describe('signUpAction welcome-email link origin (#24b)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    requestHeaders = new Headers();
  });

  it('production: link uses NEXT_PUBLIC_APP_URL, never a forged x-forwarded-host', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://iclanguages.com');
    requestHeaders = new Headers({ 'x-forwarded-host': 'evil.example', host: 'evil.example' });
    rate.mockResolvedValue({ success: true, remaining: 1, reset: 0 });

    await signUpAction(input);

    expect(welcomeEmail).toHaveBeenCalledWith(expect.objectContaining({ appUrl: 'https://iclanguages.com' }));
  });

  it('production without NEXT_PUBLIC_APP_URL: account is still created; link falls back to relative, not the forged host', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    requestHeaders = new Headers({ 'x-forwarded-host': 'evil.example', host: 'evil.example' });
    rate.mockResolvedValue({ success: true, remaining: 1, reset: 0 });

    const res = await signUpAction(input);

    expect(res?.data).toEqual({ success: true });
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(welcomeEmail).toHaveBeenCalledWith(expect.objectContaining({ appUrl: '' }));
  });
});
