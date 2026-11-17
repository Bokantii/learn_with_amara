import { prisma } from '../prisma';
import { listStudentAttempts } from '../assessments/attempt';
import { perSkillBreakdown, type SkillBreakdownRow } from '../assessments/placement';
import {
  assignmentAveragePercent,
  buildScoreTrend,
  objectiveVsManual,
  type ObjectiveVsManual,
} from './analytics';

/**
 * Server-side aggregation for the student Results page and the dashboard's
 * results/analytics cards (SPEC §10.8, §10.2). Every query is scoped to the
 * signed-in `userId` / `studentId` — no identifier is taken from the client, so
 * there is no cross-student exposure here. Per-attempt detail is served by the
 * already-ownership-checked `/assessments/result/[attemptId]` route.
 */

export interface AssignmentGrade {
  title: string;
  programName: string;
  score: number;
  points: number;
  percent: number;
  feedback: string | null;
  /** The `Submission` model has no grade timestamp — this is the submission date. */
  submittedAt: Date;
}

export type ResultAttempt = Awaited<ReturnType<typeof listStudentAttempts>>[number];

export interface StudentResultsData {
  assignmentGrades: AssignmentGrade[];
  assignmentAverage: number | null;
  attempts: ResultAttempt[];
  latestPlacement: ResultAttempt | null;
  skillBreakdown: SkillBreakdownRow[];
  trend: { label: string; percent: number }[] | null;
  scoring: ObjectiveVsManual;
  gradedItemCount: number;
  isEmpty: boolean;
}

/**
 * @param includeSkills  Run the per-skill breakdown query. The Results page
 *   needs it (the radar chart); the dashboard doesn't, so it opts out to avoid
 *   the `AssessmentResponse` join on every render.
 */
export async function getStudentResults(
  userId: string,
  { includeSkills = true }: { includeSkills?: boolean } = {}
): Promise<StudentResultsData> {
  const [submissions, attempts, skillRows] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId: userId, status: 'GRADED', score: { not: null } },
      orderBy: { submittedAt: 'desc' },
      select: {
        score: true,
        feedback: true,
        submittedAt: true,
        assignment: {
          select: { title: true, points: true, program: { select: { name: true } } },
        },
      },
    }),
    listStudentAttempts(userId),
    includeSkills
      ? prisma.assessmentResponse.findMany({
          where: {
            attempt: { userId, status: { in: ['GRADED', 'AWAITING_REVIEW'] } },
            question: { type: 'SINGLE_CHOICE' },
          },
          select: { isCorrect: true, question: { select: { skill: true } } },
        })
      : Promise.resolve([]),
  ]);

  const assignmentGrades: AssignmentGrade[] = submissions.map((s) => {
    const score = s.score ?? 0;
    const points = s.assignment.points;
    return {
      title: s.assignment.title,
      programName: s.assignment.program.name,
      score,
      points,
      percent: pct(score, points),
      feedback: s.feedback,
      submittedAt: s.submittedAt,
    };
  });

  const assignmentAverage = assignmentAveragePercent(
    submissions.map((s) => ({ score: s.score ?? 0, points: s.assignment.points }))
  );

  const skillBreakdown = perSkillBreakdown(
    skillRows.map((r) => ({ skill: r.question.skill, isCorrect: !!r.isCorrect }))
  );

  // Trend is built from graded assignments only (oldest → newest); placement
  // outcomes are a CEFR estimate, not a comparable running score.
  const trend = buildScoreTrend(
    submissions
      .filter((s) => s.assignment.points > 0)
      .map((s) => ({
        label: shortDate(s.submittedAt),
        percent: pct(s.score ?? 0, s.assignment.points),
        at: s.submittedAt,
      }))
  );

  const latestPlacement =
    attempts.find((a) => a.assessment.type === 'PLACEMENT') ?? null;

  return {
    assignmentGrades,
    assignmentAverage,
    attempts,
    latestPlacement,
    skillBreakdown,
    trend,
    scoring: objectiveVsManual(attempts),
    gradedItemCount: assignmentGrades.length + attempts.length,
    isEmpty: assignmentGrades.length === 0 && attempts.length === 0,
  };
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** score/points as a whole percent, clamped to 0–100 (a grader typo can exceed points). */
function pct(score: number, points: number): number {
  if (points <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((score / points) * 100)));
}
