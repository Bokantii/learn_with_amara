import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * getAppOrigin / getAppOriginOrEmpty (#24b): in production the origin comes
 * only from NEXT_PUBLIC_APP_URL, never from attacker-influenceable forwarded
 * headers.
 */

let requestHeaders = new Headers();
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));

import { getAppOrigin, getAppOriginOrEmpty } from './app-url';

const FORGED = { 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https', host: 'evil.example' };

afterEach(() => {
  vi.unstubAllEnvs();
  requestHeaders = new Headers();
});

describe('getAppOrigin', () => {
  it('production: uses NEXT_PUBLIC_APP_URL and ignores forged forwarded headers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://iclanguages.com/');
    requestHeaders = new Headers(FORGED);
    await expect(getAppOrigin()).resolves.toBe('https://iclanguages.com');
  });

  it('production without NEXT_PUBLIC_APP_URL: throws instead of trusting headers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    requestHeaders = new Headers(FORGED);
    await expect(getAppOrigin()).rejects.toThrow(/NEXT_PUBLIC_APP_URL must be set/);
    await expect(getAppOriginOrEmpty()).resolves.toBe('');
  });

  it('development without NEXT_PUBLIC_APP_URL: derives the origin from the request host', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    requestHeaders = new Headers({ host: 'localhost:3000' });
    await expect(getAppOrigin()).resolves.toBe('http://localhost:3000');
  });
});
