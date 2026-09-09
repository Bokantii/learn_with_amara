import type { CefrLevel } from '../generated/prisma/client';
import { prisma } from '../prisma';
import { hasProgramAccess } from '../authz';
import { DEFAULT_PLACEMENT_QUESTION_COUNT } from './constants';
import { gradeAutoResponse, isAutoGraded, rollUpAttemptScore } from './grading';
import {
  buildResultSummary,
  estimateCefrLevel,
  perSkillBreakdown,
  tallyByLevel,
} from './placement';
import { recommendTrack } from './recommendation';
import { selectQuestions } from './selection';
import { toReviewQuestion, toStudentQuestion, type StudentQuestion } from './serialize';
import { ownsAttempt, type AttemptActor } from './ownership';

/**
 * Attempt lifecycle (SPEC §9.2, §11.9). Every function that mutates or reads an
 * attempt takes an `AttemptActor` and enforces `ownsAttempt(...)` — a signed-in
 * student is matched by `userId`, an anonymous public-placement visitor by the
 * hash of their claim-token cookie. Nobody can see or touch an attempt they
 * don't own (SPEC §19 IDOR). Answer keys never leave this module except via
 * `toReviewQuestion`, and only after the attempt is submitted.
 */

export type StartAttemptError =
  | 'ASSESSMENT_NOT_FOUND'
  | 'ASSESSMENT_NOT_PUBLISHED'
  | 'TYPE_NOT_AVAILABLE'
  | 'AUTH_REQUIRED'
  | 'NOT_ENTITLED'
  | 'NO_QUESTIONS';

const QUESTION_INCLUDE = {
  options: { orderBy: { order: 'asc' } },
} as const;

export async function startOrResumeAttempt(input: {
  assessmentId: string;
  actor: AttemptActor;
  /** sha256 of a fresh claim token, when an anonymous attempt is being created */
  newClaimTokenHash?: string | null;
}): Promise<
  | { ok: true; attemptId: string; createdAnonymous: boolean }
  | { ok: false; error: StartAttemptError }
> {
  const { assessmentId, actor } = input;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, type: true, status: true, programId: true, questionCount: true },
  });
  if (!assessment) return { ok: false, error: 'ASSESSMENT_NOT_FOUND' };
  if (assessment.status !== 'PUBLISHED') return { ok: false, error: 'ASSESSMENT_NOT_PUBLISHED' };
  // MOCK_EXAM is a reserved type with no take flow in this milestone.
  if (assessment.type === 'MOCK_EXAM') return { ok: false, error: 'TYPE_NOT_AVAILABLE' };

  // Only PLACEMENT is public. Everything else needs a signed-in student.
  if (assessment.type !== 'PLACEMENT' && actor.userId == null) {
    return { ok: false, error: 'AUTH_REQUIRED' };
  }

  if (assessment.type === 'PRACTICE') {
    if (!assessment.programId || !actor.userId) return { ok: false, error: 'NOT_ENTITLED' };
    const entitled = await hasProgramAccess(actor.userId, assessment.programId);
    if (!entitled) return { ok: false, error: 'NOT_ENTITLED' };
  }

  const resumeWhere = actor.userId
    ? { userId: actor.userId, assessmentId, status: 'IN_PROGRESS' as const }
    : actor.claimTokenHash
      ? { claimTokenHash: actor.claimTokenHash, assessmentId, status: 'IN_PROGRESS' as const }
      : null;
  if (resumeWhere) {
    const existing = await prisma.assessmentAttempt.findFirst({
      where: resumeWhere,
      select: { id: true },
    });
    if (existing) return { ok: true, attemptId: existing.id, createdAnonymous: false };
  }

  // An anonymous attempt can never be surfaced back to a grader-less taker, so
  // it must be 100% auto-gradable — never draw a human-graded question into it
  // (also keeps anonymous free-text PII out of the review queue).
  const pool = await prisma.question.findMany({
    where: {
      assessmentId,
      active: true,
      ...(actor.userId ? {} : { type: 'SINGLE_CHOICE' as const }),
    },
    select: { id: true, cefrLevel: true },
  });
  if (pool.length === 0) return { ok: false, error: 'NO_QUESTIONS' };

  const shuffled = shuffle(pool);
  const drawCount = assessment.questionCount ?? DEFAULT_PLACEMENT_QUESTION_COUNT;
  const selected = selectQuestions(shuffled, drawCount);

  const anonymous = actor.userId == null;
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      userId: actor.userId ?? null,
      claimTokenHash: anonymous ? (input.newClaimTokenHash ?? null) : null,
      questions: {
        create: selected.map((q, index) => ({ questionId: q.id, order: index })),
      },
    },
    select: { id: true },
  });

  return { ok: true, attemptId: attempt.id, createdAnonymous: anonymous };
}

export interface RunnerState {
  attemptId: string;
  assessmentTitle: string;
  assessmentType: string;
  questions: StudentQuestion[];
  responses: Record<string, { selectedOptionId: string | null; textResponse: string | null }>;
}

/** Take-flow state. Returns null if the attempt is missing, not owned, or not IN_PROGRESS. */
export async function getRunnerState(
  actor: AttemptActor,
  attemptId: string
): Promise<RunnerState | null> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      claimTokenHash: true,
      status: true,
      assessment: { select: { title: true, type: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: { question: { include: QUESTION_INCLUDE } },
      },
      responses: {
        select: { questionId: true, selectedOptionId: true, textResponse: true },
      },
    },
  });
  if (!attempt || !ownsAttempt(attempt, actor) || attempt.status !== 'IN_PROGRESS') return null;

  return {
    attemptId: attempt.id,
    assessmentTitle: attempt.assessment.title,
    assessmentType: attempt.assessment.type,
    questions: attempt.questions.map((row) => toStudentQuestion(row.question)),
    responses: Object.fromEntries(
      attempt.responses.map((r) => [
        r.questionId,
        { selectedOptionId: r.selectedOptionId, textResponse: r.textResponse },
      ])
    ),
  };
}

export type RecordResponseError = 'ATTEMPT_NOT_OPEN' | 'QUESTION_NOT_IN_ATTEMPT' | 'INVALID_OPTION';

export async function recordResponse(input: {
  actor: AttemptActor;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string | null;
  textResponse?: string | null;
}): Promise<{ ok: true } | { ok: false; error: RecordResponseError }> {
  const { actor, attemptId, questionId } = input;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      userId: true,
      claimTokenHash: true,
      status: true,
      questions: { where: { questionId }, select: { questionId: true } },
    },
  });
  if (!attempt || !ownsAttempt(attempt, actor) || attempt.status !== 'IN_PROGRESS') {
    return { ok: false, error: 'ATTEMPT_NOT_OPEN' };
  }
  if (attempt.questions.length === 0) return { ok: false, error: 'QUESTION_NOT_IN_ATTEMPT' };

  let selectedOptionId: string | null = null;
  let textResponse: string | null = null;

  if (input.selectedOptionId) {
    const option = await prisma.questionOption.findFirst({
      where: { id: input.selectedOptionId, questionId },
      select: { id: true },
    });
    if (!option) return { ok: false, error: 'INVALID_OPTION' };
    selectedOptionId = option.id;
  } else if (typeof input.textResponse === 'string') {
    textResponse = input.textResponse.trim() || null;
  }

  await prisma.assessmentResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, selectedOptionId, textResponse },
    update: { selectedOptionId, textResponse, isCorrect: null, awardedPoints: null },
  });

  return { ok: true };
}

export type SubmitError = 'ATTEMPT_NOT_OPEN';

export async function submitAttempt(input: {
  actor: AttemptActor;
  attemptId: string;
}): Promise<{ ok: true; status: 'AWAITING_REVIEW' | 'GRADED' } | { ok: false; error: SubmitError }> {
  const { actor, attemptId } = input;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      userId: true,
      claimTokenHash: true,
      status: true,
      assessment: { select: { type: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: {
          question: {
            select: {
              id: true,
              type: true,
              skill: true,
              cefrLevel: true,
              maxPoints: true,
              options: { select: { id: true, isCorrect: true } },
            },
          },
        },
      },
      responses: { select: { id: true, questionId: true, selectedOptionId: true } },
    },
  });
  if (!attempt || !ownsAttempt(attempt, actor) || attempt.status !== 'IN_PROGRESS') {
    return { ok: false, error: 'ATTEMPT_NOT_OPEN' };
  }

  const questions = attempt.questions.map((row) => row.question);
  const responseByQuestion = new Map(attempt.responses.map((r) => [r.questionId, r]));

  // Auto-grade the SINGLE_CHOICE responses.
  const autoUpdates: { id: string; isCorrect: boolean; awardedPoints: number }[] = [];
  const autoGraded: { cefrLevel: (typeof questions)[number]['cefrLevel']; skill: (typeof questions)[number]['skill']; isCorrect: boolean }[] = [];

  for (const q of questions) {
    if (!isAutoGraded(q.type)) continue;
    const response = responseByQuestion.get(q.id);
    const result = gradeAutoResponse(q, response?.selectedOptionId);
    if (!result) continue;
    autoGraded.push({ cefrLevel: q.cefrLevel, skill: q.skill, isCorrect: result.isCorrect });
    if (response) {
      autoUpdates.push({ id: response.id, isCorrect: result.isCorrect, awardedPoints: result.awardedPoints });
    }
  }

  const awardedByResponseId = new Map(autoUpdates.map((u) => [u.id, u.awardedPoints]));
  const rollup = rollUpAttemptScore(
    questions.map((q) => ({ id: q.id, type: q.type, maxPoints: q.maxPoints })),
    attempt.responses.map((r) => ({
      questionId: r.questionId,
      awardedPoints: awardedByResponseId.has(r.id) ? awardedByResponseId.get(r.id)! : null,
    }))
  );

  const hasFreeText = questions.some((q) => !isAutoGraded(q.type));
  const nextStatus: 'AWAITING_REVIEW' | 'GRADED' = hasFreeText ? 'AWAITING_REVIEW' : 'GRADED';
  const now = new Date();

  // Placement result (auto-graded only) — computed at submit for a fully auto assessment.
  let estimatedCefr: CefrLevel | null = null;
  let recommendedTrack: string | null = null;
  let resultSummary: string | null = null;

  if (attempt.assessment.type === 'PLACEMENT' && !hasFreeText) {
    const level = estimateCefrLevel(tallyByLevel(autoGraded));
    const rec = recommendTrack(level);
    const program = await prisma.program.findFirst({
      where: { track: rec.track },
      select: { name: true },
    });
    const overallPct =
      rollup.autoMaxPoints === 0
        ? 0
        : Math.round((rollup.autoScorePoints / rollup.autoMaxPoints) * 100);
    estimatedCefr = level;
    recommendedTrack = rec.track;
    resultSummary = buildResultSummary({
      estimatedCefr: level,
      overallPercentage: overallPct,
      recommendedProgramName: program?.name ?? rec.headline,
    });
  }

  await prisma.$transaction([
    ...autoUpdates.map((u) =>
      prisma.assessmentResponse.update({
        where: { id: u.id },
        data: { isCorrect: u.isCorrect, awardedPoints: u.awardedPoints },
      })
    ),
    prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: nextStatus,
        submittedAt: now,
        gradedAt: nextStatus === 'GRADED' ? now : null,
        autoScorePoints: rollup.autoScorePoints,
        autoMaxPoints: rollup.autoMaxPoints,
        manualMaxPoints: rollup.manualMaxPoints,
        manualScorePoints: nextStatus === 'GRADED' ? rollup.manualScorePoints : null,
        estimatedCefr,
        recommendedTrack,
        resultSummary,
      },
    }),
  ]);

  return { ok: true, status: nextStatus };
}

export async function listStudentAttempts(userId: string) {
  return prisma.assessmentAttempt.findMany({
    where: { userId, status: { in: ['AWAITING_REVIEW', 'GRADED'] } },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      autoScorePoints: true,
      autoMaxPoints: true,
      manualScorePoints: true,
      manualMaxPoints: true,
      estimatedCefr: true,
      resultSummary: true,
      assessment: { select: { title: true, type: true } },
    },
  });
}

export interface ResultState {
  attemptId: string;
  status: string;
  assessmentTitle: string;
  assessmentType: string;
  submittedAt: Date | null;
  autoScorePoints: number | null;
  autoMaxPoints: number | null;
  manualScorePoints: number | null;
  manualMaxPoints: number | null;
  estimatedCefr: CefrLevel | null;
  recommendedTrack: string | null;
  resultSummary: string | null;
  levelTallies: { level: string; correct: number; total: number }[];
  skillBreakdown: ReturnType<typeof perSkillBreakdown>;
  review: ReturnType<typeof toReviewQuestion>[];
}

/** Result-page state. Returns null unless the attempt is owned and no longer IN_PROGRESS. */
export async function getResultState(
  actor: AttemptActor,
  attemptId: string
): Promise<ResultState | null> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      claimTokenHash: true,
      status: true,
      submittedAt: true,
      autoScorePoints: true,
      autoMaxPoints: true,
      manualScorePoints: true,
      manualMaxPoints: true,
      estimatedCefr: true,
      recommendedTrack: true,
      resultSummary: true,
      assessment: { select: { title: true, type: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: { question: { include: QUESTION_INCLUDE } },
      },
      responses: true,
    },
  });
  if (!attempt || !ownsAttempt(attempt, actor) || attempt.status === 'IN_PROGRESS') return null;

  const responseByQuestion = new Map(attempt.responses.map((r) => [r.questionId, r]));
  const review = attempt.questions.map((row) =>
    toReviewQuestion(row.question, responseByQuestion.get(row.question.id))
  );

  const autoGraded = review
    .filter((q) => q.type === 'SINGLE_CHOICE')
    .map((q) => ({ cefrLevel: q.cefrLevel, skill: q.skill, isCorrect: q.isCorrect ?? false }));

  const tallies = tallyByLevel(autoGraded);
  const levelTallies = Object.entries(tallies).map(([level, t]) => ({
    level,
    correct: t.correct,
    total: t.total,
  }));

  return {
    attemptId: attempt.id,
    status: attempt.status,
    assessmentTitle: attempt.assessment.title,
    assessmentType: attempt.assessment.type,
    submittedAt: attempt.submittedAt,
    autoScorePoints: attempt.autoScorePoints,
    autoMaxPoints: attempt.autoMaxPoints,
    manualScorePoints: attempt.manualScorePoints,
    manualMaxPoints: attempt.manualMaxPoints,
    estimatedCefr: attempt.estimatedCefr,
    recommendedTrack: attempt.recommendedTrack,
    resultSummary: attempt.resultSummary,
    levelTallies,
    skillBreakdown: perSkillBreakdown(autoGraded),
    review,
  };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
