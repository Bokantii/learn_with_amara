import { describe, it, expect } from 'vitest';
import { computeCheckInStatus } from './status';
import { ATTENDANCE_LATE_THRESHOLD_MINUTES } from './constants';

describe('computeCheckInStatus', () => {
  const startsAt = new Date('2026-09-01T12:00:00.000Z');

  it('checking in exactly at startsAt is PRESENT', () => {
    expect(computeCheckInStatus(startsAt, startsAt)).toBe('PRESENT');
  });

  it('checking in exactly at the late threshold (inclusive) is PRESENT', () => {
    const atThreshold = new Date(startsAt.getTime() + ATTENDANCE_LATE_THRESHOLD_MINUTES * 60_000);
    expect(computeCheckInStatus(atThreshold, startsAt)).toBe('PRESENT');
  });

  it('checking in one millisecond past the late threshold is LATE', () => {
    const pastThreshold = new Date(
      startsAt.getTime() + ATTENDANCE_LATE_THRESHOLD_MINUTES * 60_000 + 1
    );
    expect(computeCheckInStatus(pastThreshold, startsAt)).toBe('LATE');
  });

  it('an early arrival (before startsAt) is PRESENT', () => {
    const early = new Date(startsAt.getTime() - 5 * 60_000);
    expect(computeCheckInStatus(early, startsAt)).toBe('PRESENT');
  });
});
