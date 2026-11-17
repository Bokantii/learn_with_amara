import { describe, it, expect } from 'vitest';
import { formatClassTime, formatClassTimeInZones, formatClassDate } from './class-time';

describe('class-time formatting (#5: no more UTC-only times)', () => {
  it('matches the team’s manual reminder: 9pm Lagos = 3pm Toronto (winter)', () => {
    // Thu 12 Nov 2026, 21:00 in Lagos (UTC+1) = 20:00 UTC
    const d = new Date('2026-11-12T20:00:00Z');
    expect(formatClassDate(d)).toBe('Thursday, November 12, 2026');
    expect(formatClassTimeInZones(d)).toEqual([
      '9:00 PM Lagos (GMT+1)',
      '3:00 PM Toronto (EST)',
      '2:00 PM Winnipeg (CST)',
      '12:00 PM Vancouver (PST)',
      '8:00 PM London (GMT)',
    ]);
  });

  it('follows daylight saving in summer (Lagos has none, the others shift)', () => {
    // Thu 9 Jul 2026, 21:00 in Lagos = 20:00 UTC
    const d = new Date('2026-07-09T20:00:00Z');
    expect(formatClassTimeInZones(d)).toEqual([
      '9:00 PM Lagos (GMT+1)',
      '4:00 PM Toronto (EDT)',
      '3:00 PM Winnipeg (CDT)',
      '1:00 PM Vancouver (PDT)',
      '9:00 PM London (GMT+1)',
    ]);
  });

  it('marks zones that are on a different calendar day than Lagos', () => {
    // Fri 13 Nov 2026, 7:00 AM in Lagos = 06:00 UTC → still Thursday in Canada
    const d = new Date('2026-11-13T06:00:00Z');
    expect(formatClassDate(d)).toBe('Friday, November 13, 2026');
    expect(formatClassTimeInZones(d)).toEqual([
      '7:00 AM Lagos (GMT+1)',
      '1:00 AM Toronto (EST)',
      '12:00 AM Winnipeg (CST)',
      '10:00 PM Thu Vancouver (PST)',
      '6:00 AM London (GMT)',
    ]);
  });

  it('produces one line with the date and every zone, and never says UTC', () => {
    const text = formatClassTime(new Date('2026-11-12T20:00:00Z'));
    expect(text).toBe(
      'Thursday, November 12, 2026 — 9:00 PM Lagos (GMT+1) · 3:00 PM Toronto (EST) · 2:00 PM Winnipeg (CST) · 12:00 PM Vancouver (PST) · 8:00 PM London (GMT)'
    );
    expect(text).not.toMatch(/UTC/);
  });
});
