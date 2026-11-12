import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Checkout redirect origin (#24b): Stripe's success/cancel URLs must come from
 * NEXT_PUBLIC_APP_URL, never from a forged x-forwarded-host header.
 */

const sessionsCreate = vi.fn();
const redirect = vi.fn();

vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers({ 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https', host: 'evil.example' }),
}));
vi.mock('next/navigation', () => ({ redirect: (...a: unknown[]) => redirect(...a) }));
vi.mock('../../lib/authz', () => ({ getSessionUser: async () => ({ id: 'user_1', role: 'STUDENT' }) }));
vi.mock('../../lib/stripe', () => ({
  isStripeConfigured: true,
  stripe: { checkout: { sessions: { create: (...a: unknown[]) => sessionsCreate(...a) } } },
}));

import { createCheckoutSessionAction } from './actions';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('createCheckoutSessionAction redirect origin', () => {
  it('builds success/cancel URLs from NEXT_PUBLIC_APP_URL, ignoring forged forwarded headers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://iclanguages.com');
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test' });

    await createCheckoutSessionAction({ planId: 'basic' });

    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.success_url).toMatch(/^https:\/\/iclanguages\.com\/checkout\/success\?/);
    expect(params.cancel_url).toMatch(/^https:\/\/iclanguages\.com\/checkout\?planId=/);
    expect(JSON.stringify(params)).not.toContain('evil.example');
    expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test');
  });

  it('production without NEXT_PUBLIC_APP_URL: no Stripe session is created', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await createCheckoutSessionAction({ planId: 'basic' });

    expect(res?.serverError).toBeTruthy();
    expect(sessionsCreate).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
