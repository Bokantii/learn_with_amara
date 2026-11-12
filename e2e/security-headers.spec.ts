import { test, expect } from '@playwright/test';

/**
 * Referrer-Policy (SPEC Known Deferred Issue #23g): pages whose URL carries a
 * single-use invite / password-reset token send no Referer at all; every other
 * page keeps the site-wide strict-origin-when-cross-origin policy.
 * Uses bogus tokens — the header is set by next.config.ts regardless of
 * whether the token is valid.
 */

test.describe('Referrer-Policy', () => {
  test('invite token page sends no-referrer', async ({ request }) => {
    const res = await request.get('/invite/not-a-real-token');
    expect(res.headers()['referrer-policy']).toBe('no-referrer');
  });

  test('reset-password token page sends no-referrer', async ({ request }) => {
    const res = await request.get('/reset-password/not-a-real-token');
    expect(res.headers()['referrer-policy']).toBe('no-referrer');
  });

  test('other pages keep the site-wide policy', async ({ request }) => {
    for (const path of ['/', '/reset-password', '/SignIn']) {
      const res = await request.get(path);
      expect(res.headers()['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    }
  });

  test('the other security headers still apply on token pages', async ({ request }) => {
    const res = await request.get('/invite/not-a-real-token');
    expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers()['content-security-policy']).toBeTruthy();
  });
});
