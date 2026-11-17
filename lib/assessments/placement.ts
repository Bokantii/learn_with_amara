import type { CefrLevel, QuestionSkill } from '../generated/prisma/client';
import { CEFR_LEVEL_ORDER, PLACEMENT_PASS_RATIO } from './constants';

/**
 * The placement "ladder" (SPEC §9.2, Task 7 locked decision). Pure — no I/O.
 *
 * Given per-CEFR-level correct/total tallies over the auto-graded questions,
 * the estimated level is the highest level the student cleared (≥ 70% correct)
 * where every lower level was also cleared. Climbing stops at the first level
 * that is failed or has no questions. `null` means A1 was not cleared.
 */

export interface LevelTally {
  correct: number;
  total: number;
}

export type TalliesByLevel = Partial<Record<CefrLevel, LevelTally>>;

export function tallyByLevel(
  items: { cefrLevel: CefrLevel | null; isCorrect: boolean }[]
): TalliesByLevel {
  const tallies: TalliesByLevel = {};
  for (const item of items) {
    if (!item.cefrLevel) continue;
    const t = (tallies[item.cefrLevel] ??= { correct: 0, total: 0 });
    t.total += 1;
    if (item.isCorrect) t.correct += 1;
  }
  return tallies;
}

export function estimateCefrLevel(tallies: TalliesByLevel): CefrLevel | null {
  let estimated: CefrLevel | null = null;
  for (const level of CEFR_LEVEL_ORDER) {
    const t = tallies[level];
    if (!t || t.total === 0) break;
    if (t.correct / t.total >= PLACEMENT_PASS_RATIO) estimated = level;
    else break;
  }
  return estimated;
}

export interface SkillBreakdownRow {
  skill: QuestionSkill;
  correct: number;
  total: number;
  percentage: number;
}

export function perSkillBreakdown(
  items: { skill: QuestionSkill; isCorrect: boolean }[]
): SkillBreakdownRow[] {
  const map = new Map<QuestionSkill, { correct: number; total: number }>();
  for (const item of items) {
    const cur = map.get(item.skill) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (item.isCorrect) cur.correct += 1;
    map.set(item.skill, cur);
  }
  return [...map.entries()].map(([skill, v]) => ({
    skill,
    correct: v.correct,
    total: v.total,
    percentage: v.total === 0 ? 0 : Math.round((v.correct / v.total) * 100),
  }));
}

const LEVEL_LABEL: Record<CefrLevel, string> = {
  A1: 'A1 (Beginner)',
  A2: 'A2 (Elementary)',
  B1: 'B1 (Intermediate)',
  B2: 'B2 (Upper Intermediate)',
  C1: 'C1 (Advanced)',
  C2: 'C2 (Mastery)',
};

export function cefrLabel(level: CefrLevel | null): string {
  return level ? LEVEL_LABEL[level] : 'Below A1';
}

export function buildResultSummary(input: {
  estimatedCefr: CefrLevel | null;
  overallPercentage: number;
  recommendedProgramName: string;
}): string {
  const level = cefrLabel(input.estimatedCefr);
  return `Estimated level: ${level} · ${input.overallPercentage}% correct · Recommended next step: ${input.recommendedProgramName}.`;
}
