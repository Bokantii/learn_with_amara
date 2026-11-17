import { describe, it, expect } from 'vitest';
import { generateClaimToken, hashClaimToken, ownsAttempt } from './ownership';

describe('claim token', () => {
  it('round-trips: hashing the raw token matches the returned hash', () => {
    const { raw, hash } = generateClaimToken();
    expect(hashClaimToken(raw)).toBe(hash);
  });

  it('is different every time', () => {
    const a = generateClaimToken();
    const b = generateClaimToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it('hashClaimToken is deterministic and collision-distinct', () => {
    expect(hashClaimToken('x')).toBe(hashClaimToken('x'));
    expect(hashClaimToken('x')).not.toBe(hashClaimToken('y'));
  });
});

describe('ownsAttempt', () => {
  it('matches on a non-null userId', () => {
    expect(
      ownsAttempt({ userId: 'u1', claimTokenHash: null }, { userId: 'u1', claimTokenHash: null })
    ).toBe(true);
  });

  it('matches on a non-null claimTokenHash', () => {
    expect(
      ownsAttempt({ userId: null, claimTokenHash: 'h1' }, { userId: null, claimTokenHash: 'h1' })
    ).toBe(true);
  });

  it('does not match when both differ', () => {
    expect(
      ownsAttempt({ userId: 'u1', claimTokenHash: 'h1' }, { userId: 'u2', claimTokenHash: 'h2' })
    ).toBe(false);
  });

  it('a null actor field never matches a null attempt field', () => {
    expect(ownsAttempt({ userId: null, claimTokenHash: null }, { userId: null, claimTokenHash: null })).toBe(false);
    expect(ownsAttempt({ userId: 'u1', claimTokenHash: null }, { userId: null, claimTokenHash: null })).toBe(false);
    expect(ownsAttempt({ userId: null, claimTokenHash: null }, { userId: null, claimTokenHash: 'h1' })).toBe(false);
  });

  it('a claim-token holder cannot open a user-owned attempt and vice versa', () => {
    expect(
      ownsAttempt({ userId: 'u1', claimTokenHash: null }, { userId: null, claimTokenHash: 'h1' })
    ).toBe(false);
    expect(
      ownsAttempt({ userId: null, claimTokenHash: 'h1' }, { userId: 'u1', claimTokenHash: null })
    ).toBe(false);
  });
});
