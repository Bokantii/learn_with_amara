import { describe, it, expect } from 'vitest';
import {
  estimateCefrLevel,
  tallyByLevel,
  perSkillBreakdown,
  buildResultSummary,
  cefrLabel,
} from './placement';

describe('estimateCefrLevel', () => {
  it('returns the highest consecutively-cleared level', () => {
    expect(
      estimateCefrLevel({
        A1: { correct: 6, total: 6 }, // 100% ✓
        A2: { correct: 5, total: 6 }, // 83%  ✓
        B1: { correct: 5, total: 6 }, // 83%  ✓
        B2: { correct: 3, total: 6 }, // 50%  ✗ → estimate is B1
        C1: { correct: 1, total: 6 },
      })
    ).toBe('B1');
  });

  it('a sub-70% level below a passed level still caps the estimate', () => {
    expect(
      estimateCefrLevel({
        A1: { correct: 6, total: 6 }, // ✓
        A2: { correct: 4, total: 6 }, // 67% ✗ → climb stops, estimate A1
        B1: { correct: 6, total: 6 }, // ✓ but unreachable
      })
    ).toBe('A1');
  });

  it('is inclusive at exactly the pass ratio (0.70)', () => {
    // 7/10 = 0.70 clears; 6/10 does not
    expect(estimateCefrLevel({ A1: { correct: 7, total: 10 } })).toBe('A1');
    expect(estimateCefrLevel({ A1: { correct: 6, total: 10 } })).toBeNull();
  });

  it('returns null when A1 is not cleared', () => {
    expect(estimateCefrLevel({ A1: { correct: 1, total: 6 }, A2: { correct: 6, total: 6 } })).toBeNull();
  });

  it('stops climbing at the first level with no questions', () => {
    expect(
      estimateCefrLevel({
        A1: { correct: 6, total: 6 },
        A2: { correct: 6, total: 6 },
        // B1 absent → climb stops, estimate is A2 even though C1 data follows
        C1: { correct: 6, total: 6 },
      })
    ).toBe('A2');
  });

  it('returns null for empty tallies', () => {
    expect(estimateCefrLevel({})).toBeNull();
  });
});

describe('tallyByLevel', () => {
  it('groups correct/total per level and ignores null-level items', () => {
    expect(
      tallyByLevel([
        { cefrLevel: 'A1', isCorrect: true },
        { cefrLevel: 'A1', isCorrect: false },
        { cefrLevel: 'B1', isCorrect: true },
        { cefrLevel: null, isCorrect: true },
      ])
    ).toEqual({
      A1: { correct: 1, total: 2 },
      B1: { correct: 1, total: 1 },
    });
  });
});

describe('perSkillBreakdown', () => {
  it('produces a rounded percentage per skill', () => {
    const rows = perSkillBreakdown([
      { skill: 'GRAMMAR', isCorrect: true },
      { skill: 'GRAMMAR', isCorrect: true },
      { skill: 'GRAMMAR', isCorrect: false },
      { skill: 'READING', isCorrect: false },
    ]);
    expect(rows).toContainEqual({ skill: 'GRAMMAR', correct: 2, total: 3, percentage: 67 });
    expect(rows).toContainEqual({ skill: 'READING', correct: 0, total: 1, percentage: 0 });
  });
});

describe('buildResultSummary / cefrLabel', () => {
  it('labels a null estimate as Below A1', () => {
    expect(cefrLabel(null)).toBe('Below A1');
    expect(cefrLabel('B2')).toBe('B2 (Upper Intermediate)');
  });

  it('summarises level, percentage and recommendation', () => {
    expect(
      buildResultSummary({ estimatedCefr: 'B1', overallPercentage: 72, recommendedProgramName: 'TEF Canada Preparation' })
    ).toBe('Estimated level: B1 (Intermediate) · 72% correct · Recommended next step: TEF Canada Preparation.');
  });
});
