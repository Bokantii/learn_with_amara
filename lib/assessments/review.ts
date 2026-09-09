import { prisma } from '../prisma';
import { isAutoGraded, rollUpAttemptScore } from './grading';

/**
 * Admin manual-grading of the free-text (SHORT_TEXT / ESSAY) responses in an
 * attempt that is `AWAITING_REVIEW`. Auto-graded responses are never touched
 * here. Once every free-text response is graded the attempt is finalized to
 * `GRADED`.
 */

export type GradeResponseError =
  | 'QUESTION_NOT_IN_ATTEMPT'
  | 'ATTEMPT_NOT_AWAITING_REVIEW'
  | 'NOT_MANUALLY_GRADED'
  | 'POINTS_OUT_OF_RANGE';

/**
 * Grade one free-text question in an attempt. Keyed by `(attemptId, questionId)`
 * and upserts the response row so a question the student left blank can still be
 * scored (award 0 with feedback).
 */
export async function gradeResponse(input: {
  graderId: string;
  attemptId: string;
  questionId: string;
  awardedPoints: number;
  feedback?: string | null;
}): Promise<{ ok: true } | { ok: false; error: GradeResponseError }> {
  const link = await prisma.assessmentAttemptQuestion.findUnique({
    where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
    select: {
      attempt: { select: { status: true } },
      question: { select: { type: true, maxPoints: true } },
    },
  });
  if (!link) return { ok: false, error: 'QUESTION_NOT_IN_ATTEMPT' };
  if (link.attempt.status !== 'AWAITING_REVIEW') {
    return { ok: false, error: 'ATTEMPT_NOT_AWAITING_REVIEW' };
  }
  if (isAutoGraded(link.question.type)) {
    return { ok: false, error: 'NOT_MANUALLY_GRADED' };
  }

  const max = link.question.maxPoints ?? 1;
  if (!Number.isInteger(input.awardedPoints) || input.awardedPoints < 0 || input.awardedPoints > max) {
    return { ok: false, error: 'POINTS_OUT_OF_RANGE' };
  }

  const feedback = input.feedback?.trim() || null;
  await prisma.assessmentResponse.upsert({
    where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
    create: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      awardedPoints: input.awardedPoints,
      graderFeedback: feedback,
      gradedById: input.graderId,
    },
    update: {
      awardedPoints: input.awardedPoints,
      graderFeedback: feedback,
      gradedById: input.graderId,
    },
  });

  return { ok: true };
}

export type FinalizeError = 'ATTEMPT_NOT_AWAITING_REVIEW' | 'PENDING_RESPONSES';

/** Completes grading: every free-text question must have a graded response. */
export async function finalizeAttempt(
  attemptId: string
): Promise<{ ok: true } | { ok: false; error: FinalizeError }> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      status: true,
      autoScorePoints: true,
      autoMaxPoints: true,
      questions: {
        select: { question: { select: { id: true, type: true, maxPoints: true } } },
      },
      responses: { select: { questionId: true, awardedPoints: true } },
    },
  });
  if (!attempt || attempt.status !== 'AWAITING_REVIEW') {
    return { ok: false, error: 'ATTEMPT_NOT_AWAITING_REVIEW' };
  }

  const questions = attempt.questions.map((row) => row.question);
  const awardedByQuestion = new Map(attempt.responses.map((r) => [r.questionId, r.awardedPoints]));

  const stillPending = questions.some(
    (q) => !isAutoGraded(q.type) && awardedByQuestion.get(q.id) == null
  );
  if (stillPending) return { ok: false, error: 'PENDING_RESPONSES' };

  const rollup = rollUpAttemptScore(
    questions.map((q) => ({ id: q.id, type: q.type, maxPoints: q.maxPoints })),
    attempt.responses.map((r) => ({ questionId: r.questionId, awardedPoints: r.awardedPoints }))
  );

  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'GRADED',
      gradedAt: new Date(),
      manualScorePoints: rollup.manualScorePoints,
      manualMaxPoints: rollup.manualMaxPoints,
    },
  });

  return { ok: true };
}

export async function getReviewQueue() {
  return prisma.assessmentAttempt.findMany({
    where: { status: 'AWAITING_REVIEW' },
    orderBy: { submittedAt: 'asc' },
    select: {
      id: true,
      submittedAt: true,
      user: { select: { name: true, email: true } },
      assessment: { select: { title: true } },
      _count: { select: { responses: true } },
    },
  });
}

export interface ReviewDetailRow {
  responseId: string | null;
  questionId: string;
  prompt: string;
  maxPoints: number;
  textResponse: string | null;
  awardedPoints: number | null;
  graderFeedback: string | null;
}

export async function getReviewDetail(attemptId: string): Promise<{
  attemptId: string;
  status: string;
  studentName: string;
  assessmentTitle: string;
  rows: ReviewDetailRow[];
} | null> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      status: true,
      user: { select: { name: true } },
      assessment: { select: { title: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: { question: { select: { id: true, type: true, prompt: true, maxPoints: true } } },
      },
      responses: {
        select: { id: true, questionId: true, textResponse: true, awardedPoints: true, graderFeedback: true },
      },
    },
  });
  if (!attempt) return null;

  const responseByQuestion = new Map(attempt.responses.map((r) => [r.questionId, r]));
  const rows: ReviewDetailRow[] = attempt.questions
    .map((row) => row.question)
    .filter((q) => !isAutoGraded(q.type))
    .map((q) => {
      const r = responseByQuestion.get(q.id);
      return {
        responseId: r?.id ?? null,
        questionId: q.id,
        prompt: q.prompt,
        maxPoints: q.maxPoints ?? 1,
        textResponse: r?.textResponse ?? null,
        awardedPoints: r?.awardedPoints ?? null,
        graderFeedback: r?.graderFeedback ?? null,
      };
    });

  return {
    attemptId: attempt.id,
    status: attempt.status,
    studentName: attempt.user?.name ?? 'Unknown student',
    assessmentTitle: attempt.assessment.title,
    rows,
  };
}
