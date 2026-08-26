'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';

const createProgramSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  track: z.string().trim().min(1, 'Track is required'),
});

export const createProgramAction = adminActionClient
  .schema(createProgramSchema)
  .action(async ({ parsedInput }) => {
    const program = await prisma.program.create({
      data: { name: parsedInput.name, track: parsedInput.track },
    });

    revalidatePath('/admin/programs');
    revalidatePath('/admin');
    return { programId: program.id };
  });

const updateProgramSchema = z.object({
  programId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required'),
  track: z.string().trim().min(1, 'Track is required'),
});

export const updateProgramAction = adminActionClient
  .schema(updateProgramSchema)
  .action(async ({ parsedInput }) => {
    await prisma.program.update({
      where: { id: parsedInput.programId },
      data: { name: parsedInput.name, track: parsedInput.track },
    });

    revalidatePath('/admin/programs');
    revalidatePath('/admin');
    revalidatePath('/admin/students');
    return { success: true };
  });

const setProgramActiveSchema = z.object({
  programId: z.string().min(1),
  active: z.boolean(),
});

export const setProgramActiveAction = adminActionClient
  .schema(setProgramActiveSchema)
  .action(async ({ parsedInput }) => {
    await prisma.program.update({
      where: { id: parsedInput.programId },
      data: { active: parsedInput.active },
    });

    revalidatePath('/admin/programs');
    revalidatePath('/admin/students');
    return { success: true };
  });
