import { describe, it, expect } from 'vitest';
import { generateAttendanceToken, hashAttendanceToken } from './token';

describe('generateAttendanceToken / hashAttendanceToken', () => {
  it('round-trips: hashing the generated raw token matches the returned hash', () => {
    const { rawToken, tokenHash } = generateAttendanceToken();
    expect(hashAttendanceToken(rawToken)).toBe(tokenHash);
  });

  it('never produces the same raw token twice', () => {
    const a = generateAttendanceToken();
    const b = generateAttendanceToken();
    expect(a.rawToken).not.toBe(b.rawToken);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('hashAttendanceToken is deterministic for the same input', () => {
    expect(hashAttendanceToken('same-input')).toBe(hashAttendanceToken('same-input'));
  });

  it('hashAttendanceToken produces different output for different input', () => {
    expect(hashAttendanceToken('input-a')).not.toBe(hashAttendanceToken('input-b'));
  });
});
