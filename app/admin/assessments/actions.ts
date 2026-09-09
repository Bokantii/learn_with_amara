'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';
import { MAX_TEXT_RESPONSE_CHARS } from '../../../lib/assessments/constants';
import { gradeResponse, finalizeAttempt } from '../../../lib/assessments/review';

/**
 * Admin assessment authoring + manual grading (SPEC §11.9). All actions are
 * `adminActionClient` — the manual-grade path is intentionally ADMIN-only in v1.
 */

const cefr = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const skill = z.enum(['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'WRITING', 'SPEAKING']);
const questionType = z.enum(['SINGLE_CHOICE', 'SHORT_TEXT', 'ESSAY']);

// ─── Assessment ───────────────────────────────────────────────────────────

const assessmentFields = z.object({
  type: z.enum(['PLACEMENT', 'PRACTICE', 'MOCK_EXAM']),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  programId: z.string().min(1).optional(),
  questionCount: z.number().int().positive().optional(),
  passPercentage: z.number().int().min(0).max(100).optional(),
});

export const createAssessmentAction = adminActionClient
  .schema(assessmentFields)
  .action(async ({ parsedInput }) => {
    if (parsedInput.type === 'PRACTICE' && !parsedInput.programId) {
      throw new Error('Practice assessments must be attached to a program.');
    }
    const assessment = await prisma.assessment.create({
      data: {
        type: parsedInput.type,
        title: parsedInput.title,
        description: parsedInput.description || null,
        programId: parsedInput.type === 'PRACTICE' ? parsedInput.programId : null,
        questionCount: parsedInput.questionCount ?? null,
        passPercentage: parsedInput.passPercentage ?? null,
      },
    });
    revalidatePath('/admin/assessments');
    return { assessmentId: assessment.id };
  });

export const updateAssessmentAction = adminActionClient
  .schema(assessmentFields.extend({ assessmentId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    if (parsedInput.type === 'PRACTICE' && !parsedInput.programId) {
      throw new Error('Practice assessments must be attached to a program.');
    }
    await prisma.assessment.update({
      where: { id: parsedInput.assessmentId },
      data: {
        type: parsedInput.type,
        title: parsedInput.title,
        description: parsedInput.description || null,
        programId: parsedInput.type === 'PRACTICE' ? parsedInput.programId : null,
        questionCount: parsedInput.questionCount ?? null,
        passPercentage: parsedInput.passPercentage ?? null,
      },
    });
    revalidatePath('/admin/assessments');
    revalidatePath(`/admin/assessments/${parsedInput.assessmentId}`);
    revalidatePath('/assessments');
    return { success: true };
  });

export const setAssessmentStatusAction = adminActionClient
  .schema(
    z.object({
      assessmentId: z.string().min(1),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    })
  )
  .action(async ({ parsedInput }) => {
    if (parsedInput.status === 'PUBLISHED') {
      const questions = await prisma.question.findMany({
        where: { assessmentId: parsedInput.assessmentId, active: true },
        select: { id: true, type: true, options: { select: { isCorrect: true } } },
      });
      if (questions.length === 0) {
        throw new Error('Add at least one active question before publishing.');
      }
      const broken = questions.find(
        (q) => q.type === 'SINGLE_CHOICE' && q.options.filter((o) => o.isCorrect).length !== 1
      );
      if (broken) {
        throw new Error('Every single-choice question needs exactly one correct option.');
      }
    }
    await prisma.assessment.update({
      where: { id: parsedInput.assessmentId },
      data: { status: parsedInput.status },
    });
    revalidatePath('/admin/assessments');
    revalidatePath(`/admin/assessments/${parsedInput.assessmentId}`);
    revalidatePath('/assessments');
    return { success: true };
  });

// ─── Questions ────────────────────────────────────────────────────────────

const questionFields = z.object({
  type: questionType,
  skill,
  cefrLevel: cefr.optional(),
  prompt: z.string().trim().min(1, 'Prompt is required'),
  explanation: z.string().trim().optional(),
  maxPoints: z.number().int().positive().max(100).optional(),
});

export const createQuestionAction = adminActionClient
  .schema(questionFields.extend({ assessmentId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const last = await prisma.question.findFirst({
      where: { assessmentId: parsedInput.assessmentId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const question = await prisma.question.create({
      data: {
        assessmentId: parsedInput.assessmentId,
        type: parsedInput.type,
        skill: parsedInput.skill,
        cefrLevel: parsedInput.cefrLevel ?? null,
        prompt: parsedInput.prompt,
        explanation: parsedInput.explanation || null,
        maxPoints: parsedInput.type === 'SINGLE_CHOICE' ? null : parsedInput.maxPoints ?? 1,
        order: (last?.order ?? -1) + 1,
      },
    });
    revalidatePath(`/admin/assessments/${parsedInput.assessmentId}`);
    return { questionId: question.id };
  });

export const updateQuestionAction = adminActionClient
  .schema(questionFields.extend({ questionId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const question = await prisma.question.update({
      where: { id: parsedInput.questionId },
      data: {
        type: parsedInput.type,
        skill: parsedInput.skill,
        cefrLevel: parsedInput.cefrLevel ?? null,
        prompt: parsedInput.prompt,
        explanation: parsedInput.explanation || null,
        maxPoints: parsedInput.type === 'SINGLE_CHOICE' ? null : parsedInput.maxPoints ?? 1,
      },
      select: { assessmentId: true },
    });
    revalidatePath(`/admin/assessments/${question.assessmentId}`);
    return { success: true };
  });

export const setQuestionActiveAction = adminActionClient
  .schema(z.object({ questionId: z.string().min(1), active: z.boolean() }))
  .action(async ({ parsedInput }) => {
    const question = await prisma.question.update({
      where: { id: parsedInput.questionId },
      data: { active: parsedInput.active },
      select: { assessmentId: true },
    });
    revalidatePath(`/admin/assessments/${question.assessmentId}`);
    return { success: true };
  });

export const reorderQuestionAction = adminActionClient
  .schema(z.object({ questionId: z.string().min(1), direction: z.enum(['up', 'down']) }))
  .action(async ({ parsedInput }) => {
    const current = await prisma.question.findUniqueOrThrow({
      where: { id: parsedInput.questionId },
      select: { id: true, order: true, assessmentId: true },
    });
    const sibling = await prisma.question.findFirst({
      where: {
        assessmentId: current.assessmentId,
        order: parsedInput.direction === 'up' ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: parsedInput.direction === 'up' ? 'desc' : 'asc' },
      select: { id: true, order: true },
    });
    if (sibling) {
      await prisma.$transaction([
        prisma.question.update({ where: { id: current.id }, data: { order: sibling.order } }),
        prisma.question.update({ where: { id: sibling.id }, data: { order: current.order } }),
      ]);
    }
    revalidatePath(`/admin/assessments/${current.assessmentId}`);
    return { success: true };
  });

// ─── Options ──────────────────────────────────────────────────────────────

async function enforceSingleCorrect(questionId: string, keepOptionId: string | null) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { type: true },
  });
  if (question?.type !== 'SINGLE_CHOICE' || !keepOptionId) return;
  await prisma.questionOption.updateMany({
    where: { questionId, id: { not: keepOptionId } },
    data: { isCorrect: false },
  });
}

export const addOptionAction = adminActionClient
  .schema(
    z.object({
      questionId: z.string().min(1),
      text: z.string().trim().min(1, 'Option text is required'),
      isCorrect: z.boolean().optional().default(false),
    })
  )
  .action(async ({ parsedInput }) => {
    const last = await prisma.questionOption.findFirst({
      where: { questionId: parsedInput.questionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const option = await prisma.questionOption.create({
      data: {
        questionId: parsedInput.questionId,
        text: parsedInput.text,
        isCorrect: parsedInput.isCorrect,
        order: (last?.order ?? -1) + 1,
      },
      select: { id: true, question: { select: { assessmentId: true } } },
    });
    if (parsedInput.isCorrect) await enforceSingleCorrect(parsedInput.questionId, option.id);
    revalidatePath(`/admin/assessments/${option.question.assessmentId}`);
    return { optionId: option.id };
  });

export const updateOptionAction = adminActionClient
  .schema(
    z.object({
      optionId: z.string().min(1),
      text: z.string().trim().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
    })
  )
  .action(async ({ parsedInput }) => {
    const option = await prisma.questionOption.update({
      where: { id: parsedInput.optionId },
      data: { text: parsedInput.text, isCorrect: parsedInput.isCorrect },
      select: { id: true, questionId: true, question: { select: { assessmentId: true } } },
    });
    if (parsedInput.isCorrect) await enforceSingleCorrect(option.questionId, option.id);
    revalidatePath(`/admin/assessments/${option.question.assessmentId}`);
    return { success: true };
  });

export const deleteOptionAction = adminActionClient
  .schema(z.object({ optionId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const option = await prisma.questionOption.delete({
      where: { id: parsedInput.optionId },
      select: { question: { select: { assessmentId: true } } },
    });
    revalidatePath(`/admin/assessments/${option.question.assessmentId}`);
    return { success: true };
  });

// ─── Manual grading ───────────────────────────────────────────────────────

export const gradeAssessmentResponseAction = adminActionClient
  .schema(
    z.object({
      attemptId: z.string().min(1),
      questionId: z.string().min(1),
      awardedPoints: z.number().int().min(0),
      feedback: z.string().trim().max(MAX_TEXT_RESPONSE_CHARS).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const result = await gradeResponse({
      graderId: ctx.adminId,
      attemptId: parsedInput.attemptId,
      questionId: parsedInput.questionId,
      awardedPoints: parsedInput.awardedPoints,
      feedback: parsedInput.feedback ?? null,
    });
    if (!result.ok) return { ok: false as const, error: result.error };
    revalidatePath('/admin/assessments/review');
    revalidatePath(`/admin/assessments/review/${parsedInput.attemptId}`);
    return { ok: true as const };
  });

export const finalizeAttemptAction = adminActionClient
  .schema(z.object({ attemptId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const result = await finalizeAttempt(parsedInput.attemptId);
    if (!result.ok) return { ok: false as const, error: result.error };
    revalidatePath('/admin/assessments/review');
    revalidatePath(`/admin/assessments/review/${parsedInput.attemptId}`);
    revalidatePath('/assessments/history');
    return { ok: true as const };
  });
