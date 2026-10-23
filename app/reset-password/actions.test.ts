import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Password-reset throttling (#11): a throttled request keeps the neutral
 * response and schedules no email work; an unavailable limiter is surfaced with
 * a message that is identical for every address.
 */

const rate = vi.fn();
const after = vi.fn();
const issuePasswordReset = vi.fn();

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/server', () => ({ after: (...a: unknown[]) => after(...a) }));
vi.mock('../../lib/rate-limit', async (orig) => ({
  ...(await orig<typeof import('../../lib/rate-limit')>()),
  checkPasswordResetRequestRateLimit: (...a: unknown[]) => rate(...a),
}));
vi.mock('../../lib/account/lifecycle', () => ({
  issuePasswordReset: (...a: unknown[]) => issuePasswordReset(...a),
  consumeAccountToken: vi.fn(),
}));
vi.mock('../../lib/account/mail', () => ({ sendAccountEmail: vi.fn() }));
vi.mock('../../lib/app-url', () => ({ getAppOriginOrEmpty: async () => 'https://iclanguages.com' }));
vi.mock('../../lib/authz', () => ({ getSessionUser: vi.fn() }));
vi.mock('../../emails/PasswordResetEmail', () => ({ default: () => null }));

import { requestPasswordResetAction } from './actions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requestPasswordResetAction rate limiting', () => {
  it('allowed: neutral response and the deferred send is scheduled', async () => {
    rate.mockResolvedValue({ success: true, remaining: 2, reset: 0 });
    const res = await requestPasswordResetAction({ email: 'a@x.com' });
    expect(res?.data).toEqual({ ok: true });
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('limited: same neutral response, no email work scheduled', async () => {
    rate.mockResolvedValue({ success: false, remaining: 0, reset: 0, reason: 'limited' });
    const res = await requestPasswordResetAction({ email: 'a@x.com' });
    expect(res?.data).toEqual({ ok: true });
    expect(after).not.toHaveBeenCalled();
    expect(issuePasswordReset).not.toHaveBeenCalled();
  });

  it('unavailable: generic, address-independent error and no email work', async () => {
    rate.mockResolvedValue({ success: false, remaining: 0, reset: 0, reason: 'unavailable' });
    const known = await requestPasswordResetAction({ email: 'known@x.com' });
    const unknown = await requestPasswordResetAction({ email: 'nobody@x.com' });
    expect(known?.serverError).toMatch(/temporarily unavailable/);
    expect(unknown?.serverError).toBe(known?.serverError);
    expect(after).not.toHaveBeenCalled();
  });
});
