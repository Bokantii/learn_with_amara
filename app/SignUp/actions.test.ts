import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Sign-up throttling (#11): a denied request creates no account. */

const rate = vi.fn();
const userCreate = vi.fn();

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('../../lib/rate-limit', async (orig) => ({
  ...(await orig<typeof import('../../lib/rate-limit')>()),
  checkSignUpRateLimit: (...a: unknown[]) => rate(...a),
}));
vi.mock('../../lib/prisma', () => ({
  prisma: { user: { findUnique: async () => null, create: (...a: unknown[]) => userCreate(...a) } },
}));
vi.mock('../../lib/email', () => ({ resend: { emails: { send: async () => ({}) } }, EMAIL_FROM: 'x' }));
vi.mock('../../lib/authz', () => ({ getSessionUser: vi.fn() }));
vi.mock('../../emails/WelcomeEmail', () => ({ default: () => null }));

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
