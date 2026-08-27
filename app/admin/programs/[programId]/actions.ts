'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../../lib/safe-action';
import { prisma } from '../../../../lib/prisma';

// ─── Modules ────────────────────────────────────────────────────────────

const createModuleSchema = z.object({
  programId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
});

export const createModuleAction = adminActionClient
  .schema(createModuleSchema)
  .action(async ({ parsedInput }) => {
    const last = await prisma.module.findFirst({
      where: { programId: parsedInput.programId },
      orderBy: { order: 'desc' },
    });

    const module_ = await prisma.module.create({
      data: {
        programId: parsedInput.programId,
        title: parsedInput.title,
        description: parsedInput.description || null,
        order: (last?.order ?? -1) + 1,
      },
    });

    revalidatePath(`/admin/programs/${parsedInput.programId}`);
    return { moduleId: module_.id };
  });

const updateModuleSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
});

export const updateModuleAction = adminActionClient
  .schema(updateModuleSchema)
  .action(async ({ parsedInput }) => {
    const module_ = await prisma.module.update({
      where: { id: parsedInput.moduleId },
      data: { title: parsedInput.title, description: parsedInput.description || null },
    });

    revalidatePath(`/admin/programs/${module_.programId}`);
    return { success: true };
  });

const setModuleActiveSchema = z.object({
  moduleId: z.string().min(1),
  active: z.boolean(),
});

export const setModuleActiveAction = adminActionClient
  .schema(setModuleActiveSchema)
  .action(async ({ parsedInput }) => {
    const module_ = await prisma.module.update({
      where: { id: parsedInput.moduleId },
      data: { active: parsedInput.active },
    });

    revalidatePath(`/admin/programs/${module_.programId}`);
    revalidatePath('/dashboard/myprograms');
    revalidatePath('/dashboard/recordedlessons');
    return { success: true };
  });

const reorderModuleSchema = z.object({
  moduleId: z.string().min(1),
  direction: z.enum(['up', 'down']),
});

export const reorderModuleAction = adminActionClient
  .schema(reorderModuleSchema)
  .action(async ({ parsedInput }) => {
    const current = await prisma.module.findUniqueOrThrow({ where: { id: parsedInput.moduleId } });
    const sibling = await prisma.module.findFirst({
      where: {
        programId: current.programId,
        order: parsedInput.direction === 'up' ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: parsedInput.direction === 'up' ? 'desc' : 'asc' },
    });

    if (sibling) {
      await prisma.$transaction([
        prisma.module.update({ where: { id: current.id }, data: { order: sibling.order } }),
        prisma.module.update({ where: { id: sibling.id }, data: { order: current.order } }),
      ]);
    }

    revalidatePath(`/admin/programs/${current.programId}`);
    return { success: true };
  });

// ─── Lessons ────────────────────────────────────────────────────────────

const createLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  durationMinutes: z.number().int().positive().optional(),
  videoUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
});

export const createLessonAction = adminActionClient
  .schema(createLessonSchema)
  .action(async ({ parsedInput }) => {
    const last = await prisma.lesson.findFirst({
      where: { moduleId: parsedInput.moduleId },
      orderBy: { order: 'desc' },
    });

    const lesson = await prisma.lesson.create({
      data: {
        moduleId: parsedInput.moduleId,
        title: parsedInput.title,
        description: parsedInput.description || null,
        durationMinutes: parsedInput.durationMinutes,
        videoUrl: parsedInput.videoUrl || null,
        order: (last?.order ?? -1) + 1,
      },
      include: { module: true },
    });

    revalidatePath(`/admin/programs/${lesson.module.programId}`);
    return { lessonId: lesson.id };
  });

const updateLessonSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  durationMinutes: z.number().int().positive().optional(),
  videoUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
});

export const updateLessonAction = adminActionClient
  .schema(updateLessonSchema)
  .action(async ({ parsedInput }) => {
    const lesson = await prisma.lesson.update({
      where: { id: parsedInput.lessonId },
      data: {
        title: parsedInput.title,
        description: parsedInput.description || null,
        durationMinutes: parsedInput.durationMinutes,
        videoUrl: parsedInput.videoUrl || null,
      },
      include: { module: true },
    });

    revalidatePath(`/admin/programs/${lesson.module.programId}`);
    revalidatePath('/dashboard/recordedlessons');
    return { success: true };
  });

const setLessonPublishedSchema = z.object({
  lessonId: z.string().min(1),
  published: z.boolean(),
});

export const setLessonPublishedAction = adminActionClient
  .schema(setLessonPublishedSchema)
  .action(async ({ parsedInput }) => {
    const lesson = await prisma.lesson.update({
      where: { id: parsedInput.lessonId },
      data: { published: parsedInput.published },
      include: { module: true },
    });

    revalidatePath(`/admin/programs/${lesson.module.programId}`);
    revalidatePath('/dashboard/myprograms');
    revalidatePath('/dashboard/recordedlessons');
    return { success: true };
  });

const reorderLessonSchema = z.object({
  lessonId: z.string().min(1),
  direction: z.enum(['up', 'down']),
});

export const reorderLessonAction = adminActionClient
  .schema(reorderLessonSchema)
  .action(async ({ parsedInput }) => {
    const current = await prisma.lesson.findUniqueOrThrow({ where: { id: parsedInput.lessonId } });
    const sibling = await prisma.lesson.findFirst({
      where: {
        moduleId: current.moduleId,
        order: parsedInput.direction === 'up' ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: parsedInput.direction === 'up' ? 'desc' : 'asc' },
    });

    if (sibling) {
      await prisma.$transaction([
        prisma.lesson.update({ where: { id: current.id }, data: { order: sibling.order } }),
        prisma.lesson.update({ where: { id: sibling.id }, data: { order: current.order } }),
      ]);
    }

    const module_ = await prisma.module.findUniqueOrThrow({ where: { id: current.moduleId } });
    revalidatePath(`/admin/programs/${module_.programId}`);
    return { success: true };
  });

// ─── Lesson resources ───────────────────────────────────────────────────

const createLessonResourceSchema = z.object({
  lessonId: z.string().min(1),
  type: z.string().trim().min(1, 'Type is required'),
  title: z.string().trim().min(1, 'Title is required'),
  url: z.string().trim().url('Enter a valid URL'),
});

export const createLessonResourceAction = adminActionClient
  .schema(createLessonResourceSchema)
  .action(async ({ parsedInput }) => {
    const last = await prisma.lessonResource.findFirst({
      where: { lessonId: parsedInput.lessonId },
      orderBy: { order: 'desc' },
    });

    await prisma.lessonResource.create({
      data: {
        lessonId: parsedInput.lessonId,
        type: parsedInput.type,
        title: parsedInput.title,
        url: parsedInput.url,
        order: (last?.order ?? -1) + 1,
      },
    });

    const lesson = await prisma.lesson.findUniqueOrThrow({
      where: { id: parsedInput.lessonId },
      include: { module: true },
    });
    revalidatePath(`/admin/programs/${lesson.module.programId}`);
    return { success: true };
  });

const deleteLessonResourceSchema = z.object({
  resourceId: z.string().min(1),
});

export const deleteLessonResourceAction = adminActionClient
  .schema(deleteLessonResourceSchema)
  .action(async ({ parsedInput }) => {
    const resource = await prisma.lessonResource.delete({
      where: { id: parsedInput.resourceId },
      include: { lesson: { include: { module: true } } },
    });

    revalidatePath(`/admin/programs/${resource.lesson.module.programId}`);
    return { success: true };
  });
