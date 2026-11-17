import { describe, it, expect } from 'vitest';
import { gradeAutoResponse, isAutoGraded, rollUpAttemptScore } from './grading';

const singleChoice = {
  type: 'SINGLE_CHOICE' as const,
  options: [
    { id: 'o1', isCorrect: false },
    { id: 'o2', isCorrect: true },
    { id: 'o3', isCorrect: false },
  ],
};

describe('isAutoGraded', () => {
  it('only SINGLE_CHOICE is auto-graded', () => {
    expect(isAutoGraded('SINGLE_CHOICE')).toBe(true);
    expect(isAutoGraded('SHORT_TEXT')).toBe(false);
    expect(isAutoGraded('ESSAY')).toBe(false);
  });
});

describe('gradeAutoResponse', () => {
  it('awards 1 point for the correct option', () => {
    expect(gradeAutoResponse(singleChoice, 'o2')).toEqual({ isCorrect: true, awardedPoints: 1 });
  });

  it('awards 0 for a wrong option', () => {
    expect(gradeAutoResponse(singleChoice, 'o1')).toEqual({ isCorrect: false, awardedPoints: 0 });
  });

  it('awards 0 when unanswered (null / undefined)', () => {
    expect(gradeAutoResponse(singleChoice, null)).toEqual({ isCorrect: false, awardedPoints: 0 });
    expect(gradeAutoResponse(singleChoice, undefined)).toEqual({ isCorrect: false, awardedPoints: 0 });
  });

  it('returns null for a free-text question (not auto-gradable)', () => {
    expect(gradeAutoResponse({ type: 'ESSAY', options: [] }, 'anything')).toBeNull();
    expect(gradeAutoResponse({ type: 'SHORT_TEXT', options: [] }, null)).toBeNull();
  });
});

describe('rollUpAttemptScore', () => {
  it('sums auto points (1 per SINGLE_CHOICE) separately from manual', () => {
    const questions = [
      { id: 'q1', type: 'SINGLE_CHOICE' as const, maxPoints: null },
      { id: 'q2', type: 'SINGLE_CHOICE' as const, maxPoints: null },
      { id: 'q3', type: 'ESSAY' as const, maxPoints: 10 },
    ];
    const responses = [
      { questionId: 'q1', awardedPoints: 1 },
      { questionId: 'q2', awardedPoints: 0 },
      { questionId: 'q3', awardedPoints: 7 },
    ];

    expect(rollUpAttemptScore(questions, responses)).toEqual({
      autoScorePoints: 1,
      autoMaxPoints: 2,
      manualScorePoints: 7,
      manualMaxPoints: 10,
      pendingManualCount: 0,
    });
  });

  it('counts an ungraded free-text question as pending, default max 1', () => {
    const questions = [
      { id: 'q1', type: 'SINGLE_CHOICE' as const, maxPoints: null },
      { id: 'q2', type: 'SHORT_TEXT' as const, maxPoints: null },
    ];
    const responses = [{ questionId: 'q1', awardedPoints: 1 }];

    expect(rollUpAttemptScore(questions, responses)).toEqual({
      autoScorePoints: 1,
      autoMaxPoints: 1,
      manualScorePoints: 0,
      manualMaxPoints: 1,
      pendingManualCount: 1,
    });
  });

  it('treats a missing auto response as 0 without inflating pending', () => {
    const questions = [{ id: 'q1', type: 'SINGLE_CHOICE' as const, maxPoints: null }];
    const rollup = rollUpAttemptScore(questions, []);
    expect(rollup.autoScorePoints).toBe(0);
    expect(rollup.autoMaxPoints).toBe(1);
    expect(rollup.pendingManualCount).toBe(0);
  });
});
