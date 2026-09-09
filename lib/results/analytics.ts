import type { SkillBreakdownRow } from '../assessments/placement';

/**
 * Pure analytics for the student Results experience (SPEC §10.8). Every value
 * here is derived from real graded records — a graded `Submission` or a
 * `GRADED` / `AWAITING_REVIEW` `AssessmentAttempt`. Nothing is fabricated: an
 * average with no inputs is `null` (→ empty state, never `0`), and a trend or
 * chart is withheld until there is genuinely enough data to be meaningful.
 */

/** Minimum graded data points before a trend chart is shown at all. */
export const TREND_MIN_POINTS = 3;

/** Minimum distinct skills before a skill radar is worth rendering. */
export const SKILL_MIN_AXES = 3;

export interface GradeInput {
  score: number;
  points: number;
}

/**
 * Mean of `score / points` across graded assignments, as a rounded percentage.
 * Entries with a non-positive `points` denominator are skipped. Returns `null`
 * when nothing qualifies so the caller can render a truthful empty state.
 */
export function assignmentAveragePercent(grades: GradeInput[]): number | null {
  const usable = grades.filter((g) => g.points > 0);
  if (usable.length === 0) return null;
  // Clamp each term to 0–100 so a grader typo (score > points) can't skew the mean.
  const sum = usable.reduce(
    (acc, g) => acc + Math.min(100, Math.max(0, (g.score / g.points) * 100)),
    0
  );
  return Math.round(sum / usable.length);
}

export interface TrendPoint {
  label: string;
  percent: number;
  at: Date;
}

/**
 * Ordered (oldest → newest) score series for the trend chart, or `null` when
 * there are fewer than `TREND_MIN_POINTS` — the chart is hidden rather than
 * drawn from one or two points.
 */
export function buildScoreTrend(
  points: TrendPoint[]
): { label: string; percent: number }[] | null {
  if (points.length < TREND_MIN_POINTS) return null;
  return [...points]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((p) => ({ label: p.label, percent: p.percent }));
}

export interface AttemptScoreInput {
  status: string;
  autoScorePoints: number | null;
  autoMaxPoints: number | null;
  manualScorePoints: number | null;
  manualMaxPoints: number | null;
}

export interface ObjectiveVsManual {
  objective: { score: number; max: number };
  manual: { score: number; max: number; pending: boolean };
}

/**
 * Splits assessment scoring into its deterministic (auto-graded single-choice)
 * and human-graded (free-text) halves across a set of attempts, so the UI can
 * show them separately (SPEC §10.8: "distinguish objective auto-grading from
 * manual-grading outcomes").
 *
 * The `manual` total covers only attempts whose review is complete — an
 * `AWAITING_REVIEW` attempt has no final manual score, so counting its
 * `manualMaxPoints` would make the fraction read low. Those attempts instead
 * set `pending: true`. The `objective` (auto) total always includes every
 * attempt, since auto-grading is finalized at submit.
 */
export function objectiveVsManual(attempts: AttemptScoreInput[]): ObjectiveVsManual {
  let objScore = 0;
  let objMax = 0;
  let manScore = 0;
  let manMax = 0;
  let pending = false;

  for (const a of attempts) {
    objScore += a.autoScorePoints ?? 0;
    objMax += a.autoMaxPoints ?? 0;
    if (a.status === 'AWAITING_REVIEW') {
      pending = true;
      continue;
    }
    manScore += a.manualScorePoints ?? 0;
    manMax += a.manualMaxPoints ?? 0;
  }

  return {
    objective: { score: objScore, max: objMax },
    manual: { score: manScore, max: manMax, pending },
  };
}

/** Whether a skill breakdown has enough distinct dimensions to plot. */
export function hasMeaningfulSkillData(rows: SkillBreakdownRow[]): boolean {
  return rows.length >= SKILL_MIN_AXES;
}
