'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { authActionClient } from '../../../../lib/safe-action';
import { getEntitledPublishedLesson } from '../../../../lib/authz';
import { prisma } from '../../../../lib/prisma';

const lessonIdSchema = z.object({
  lessonId: z.string().min(1),
});

export const startLessonAction = authActionClient
  .schema(lessonIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const lesson = await getEntitledPublishedLesson(ctx.userId, parsedInput.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found.');
    }

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: ctx.userId, lessonId: lesson.id } },
      update: {},
      create: { userId: ctx.userId, lessonId: lesson.id },
    });

    revalidatePath(`/dashboard/lesson/${lesson.id}`);
    return { success: true };
  });

export const completeLessonAction = authActionClient
  .schema(lessonIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const lesson = await getEntitledPublishedLesson(ctx.userId, parsedInput.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found.');
    }

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: ctx.userId, lessonId: lesson.id } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: { userId: ctx.userId, lessonId: lesson.id, status: 'COMPLETED', completedAt: new Date() },
    });

    revalidatePath(`/dashboard/lesson/${lesson.id}`);
    revalidatePath('/dashboard/recordedlessons');
    revalidatePath('/dashboard/myprograms');
    return { success: true };
  });
