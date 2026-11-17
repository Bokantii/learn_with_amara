import { describe, it, expect } from 'vitest';
import { generateAccountToken, hashAccountToken } from './token';

describe('account token crypto', () => {
  it('returns a URL-safe raw token and its sha256 hash', () => {
    const { rawToken, tokenHash } = generateAccountToken();
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]+$/); // base64url, no +/= padding
    expect(rawToken.length).toBeGreaterThanOrEqual(43); // 32 bytes → 43 chars
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toBe(rawToken);
  });

  it('hashing is deterministic', () => {
    const { rawToken, tokenHash } = generateAccountToken();
    expect(hashAccountToken(rawToken)).toBe(tokenHash);
  });

  it('mints a distinct token each call', () => {
    const a = generateAccountToken();
    const b = generateAccountToken();
    expect(a.rawToken).not.toBe(b.rawToken);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});
