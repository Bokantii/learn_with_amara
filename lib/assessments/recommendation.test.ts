import { describe, it, expect } from 'vitest';
import { recommendTrack } from './recommendation';

describe('recommendTrack', () => {
  it('recommends the beginner track for a null estimate and for A1/A2', () => {
    expect(recommendTrack(null).track).toBe('tcf-exam-prep');
    expect(recommendTrack('A1').track).toBe('tcf-exam-prep');
    expect(recommendTrack('A2').track).toBe('tcf-exam-prep');
  });

  it('recommends exam prep for B1/B2', () => {
    expect(recommendTrack('B1').track).toBe('tef-canada-prep');
    expect(recommendTrack('B2').track).toBe('tef-canada-prep');
  });

  it('recommends the DELF/DALF track for C1/C2', () => {
    expect(recommendTrack('C1').track).toBe('delf-dalf-track');
    expect(recommendTrack('C2').track).toBe('delf-dalf-track');
  });

  it('always returns a headline and a rationale', () => {
    for (const level of [null, 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      const rec = recommendTrack(level);
      expect(rec.headline.length).toBeGreaterThan(0);
      expect(rec.rationale.length).toBeGreaterThan(0);
    }
  });
});
