import type { QuestionType } from '../generated/prisma/client';

/**
 * Deterministic auto-grading, kept strictly separate from human-evaluated
 * sections (SPEC §9.2 / Task 7). Only `SINGLE_CHOICE` is auto-gradable; every
 * other type returns `null` here and is scored by a grader later.
 *
 * Auto-graded questions are worth 1 point each. Free-text questions carry their
 * own `maxPoints`.
 */

export function isAutoGraded(type: QuestionType): boolean {
  return type === 'SINGLE_CHOICE';
}

export interface AutoGradeResult {
  isCorrect: boolean;
  awardedPoints: number;
}

export function gradeAutoResponse(
  question: { type: QuestionType; options: { id: string; isCorrect: boolean }[] },
  selectedOptionId: string | null | undefined
): AutoGradeResult | null {
  if (!isAutoGraded(question.type)) return null;
  const correct = question.options.find((o) => o.isCorrect);
  const isCorrect = !!selectedOptionId && !!correct && selectedOptionId === correct.id;
  return { isCorrect, awardedPoints: isCorrect ? 1 : 0 };
}

export interface ScoredResponse {
  questionId: string;
  awardedPoints: number | null;
}

export interface AttemptScoreRollup {
  autoScorePoints: number;
  autoMaxPoints: number;
  manualScorePoints: number;
  manualMaxPoints: number;
  /** number of human-graded questions in the attempt that have no grade yet */
  pendingManualCount: number;
}

/**
 * Roll a set of per-response scores up to the attempt totals. `autoMaxPoints`
 * counts one point per SINGLE_CHOICE question in the (frozen) set; `manualMaxPoints`
 * sums each free-text question's `maxPoints` (default 1).
 */
export function rollUpAttemptScore(
  questions: { id: string; type: QuestionType; maxPoints: number | null }[],
  responses: ScoredResponse[]
): AttemptScoreRollup {
  const scoreByQuestion = new Map(responses.map((r) => [r.questionId, r.awardedPoints]));

  let autoScorePoints = 0;
  let autoMaxPoints = 0;
  let manualScorePoints = 0;
  let manualMaxPoints = 0;
  let pendingManualCount = 0;

  for (const q of questions) {
    const awarded = scoreByQuestion.get(q.id) ?? null;
    if (isAutoGraded(q.type)) {
      autoMaxPoints += 1;
      autoScorePoints += awarded ?? 0;
    } else {
      manualMaxPoints += q.maxPoints ?? 1;
      if (awarded == null) pendingManualCount += 1;
      else manualScorePoints += awarded;
    }
  }

  return {
    autoScorePoints,
    autoMaxPoints,
    manualScorePoints,
    manualMaxPoints,
    pendingManualCount,
  };
}
