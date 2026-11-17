import { describe, it, expect } from 'vitest';
import { perSkillBreakdown } from '../assessments/placement';
import {
  assignmentAveragePercent,
  buildScoreTrend,
  objectiveVsManual,
  hasMeaningfulSkillData,
} from './analytics';

describe('assignmentAveragePercent', () => {
  it('returns null when there are no graded assignments', () => {
    expect(assignmentAveragePercent([])).toBeNull();
  });

  it('averages score/points as a rounded percentage', () => {
    expect(
      assignmentAveragePercent([
        { score: 8, points: 10 },
        { score: 18, points: 20 },
      ])
    ).toBe(85);
  });

  it('rounds to the nearest percent', () => {
    expect(assignmentAveragePercent([{ score: 2, points: 3 }])).toBe(67);
  });

  it('skips entries with a non-positive points denominator', () => {
    expect(
      assignmentAveragePercent([
        { score: 5, points: 0 },
        { score: 10, points: 10 },
      ])
    ).toBe(100);
  });

  it('is null when every entry is unusable', () => {
    expect(assignmentAveragePercent([{ score: 3, points: 0 }])).toBeNull();
  });

  it('clamps a term to 100 when a grader awarded more than the max', () => {
    expect(
      assignmentAveragePercent([
        { score: 25, points: 20 }, // 125% → clamped to 100
        { score: 10, points: 20 }, // 50%
      ])
    ).toBe(75);
  });
});

describe('buildScoreTrend', () => {
  const p = (label: string, percent: number, iso: string) => ({
    label,
    percent,
    at: new Date(iso),
  });

  it('returns null below the minimum number of points', () => {
    expect(buildScoreTrend([])).toBeNull();
    expect(buildScoreTrend([p('a', 50, '2026-01-01'), p('b', 60, '2026-02-01')])).toBeNull();
  });

  it('returns an oldest-to-newest series once there are enough points', () => {
    const series = buildScoreTrend([
      p('Mar 3', 70, '2026-03-03'),
      p('Jan 1', 50, '2026-01-01'),
      p('Feb 2', 60, '2026-02-02'),
    ]);
    expect(series).toEqual([
      { label: 'Jan 1', percent: 50 },
      { label: 'Feb 2', percent: 60 },
      { label: 'Mar 3', percent: 70 },
    ]);
  });
});

describe('objectiveVsManual', () => {
  it('is all zeros and not pending for no attempts', () => {
    expect(objectiveVsManual([])).toEqual({
      objective: { score: 0, max: 0 },
      manual: { score: 0, max: 0, pending: false },
    });
  });

  it('reports no manual component and no pending for an auto-only attempt', () => {
    const r = objectiveVsManual([
      {
        status: 'GRADED',
        autoScorePoints: 7,
        autoMaxPoints: 10,
        manualScorePoints: null,
        manualMaxPoints: 0,
      },
    ]);
    expect(r.objective).toEqual({ score: 7, max: 10 });
    expect(r.manual).toEqual({ score: 0, max: 0, pending: false });
  });

  it('excludes an awaiting-review attempt from the manual total but flags pending', () => {
    const r = objectiveVsManual([
      {
        status: 'GRADED',
        autoScorePoints: 5,
        autoMaxPoints: 8,
        manualScorePoints: 3,
        manualMaxPoints: 4,
      },
      {
        status: 'AWAITING_REVIEW',
        autoScorePoints: 6,
        autoMaxPoints: 6,
        manualScorePoints: null,
        manualMaxPoints: 2,
      },
    ]);
    // auto totals include every attempt; manual totals only the finalized one.
    expect(r.objective).toEqual({ score: 11, max: 14 });
    expect(r.manual).toEqual({ score: 3, max: 4, pending: true });
  });
});

describe('hasMeaningfulSkillData', () => {
  it('is false below three distinct skills', () => {
    const rows = perSkillBreakdown([
      { skill: 'GRAMMAR', isCorrect: true },
      { skill: 'READING', isCorrect: false },
    ]);
    expect(hasMeaningfulSkillData(rows)).toBe(false);
  });

  it('is true once three or more skills are present', () => {
    const rows = perSkillBreakdown([
      { skill: 'GRAMMAR', isCorrect: true },
      { skill: 'READING', isCorrect: false },
      { skill: 'LISTENING', isCorrect: true },
    ]);
    expect(hasMeaningfulSkillData(rows)).toBe(true);
  });
});

describe('perSkillBreakdown aggregation for results', () => {
  it('merges responses across attempts and keeps a zero-correct skill at 0%', () => {
    const rows = perSkillBreakdown([
      // attempt 1
      { skill: 'GRAMMAR', isCorrect: true },
      { skill: 'GRAMMAR', isCorrect: false },
      { skill: 'WRITING', isCorrect: false },
      // attempt 2
      { skill: 'GRAMMAR', isCorrect: true },
      { skill: 'WRITING', isCorrect: false },
    ]);
    const grammar = rows.find((r) => r.skill === 'GRAMMAR');
    const writing = rows.find((r) => r.skill === 'WRITING');
    expect(grammar).toMatchObject({ correct: 2, total: 3, percentage: 67 });
    expect(writing).toMatchObject({ correct: 0, total: 2, percentage: 0 });
  });

  it('is empty when there are no responses', () => {
    expect(perSkillBreakdown([])).toEqual([]);
  });
});
