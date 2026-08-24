'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';

const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  programId: z.string().min(1, 'Choose a program'),
  groupId: z.string().min(1).optional(),
  dueDate: z.string().trim().min(1, 'Due date is required'),
  points: z.number().int().positive(),
  type: z.enum(['Exercise', 'Mock Test', 'Practice', 'Quiz']),
  priority: z.enum(['high', 'medium', 'low']),
});

export const createAssignmentAction = adminActionClient
  .schema(createAssignmentSchema)
  .action(async ({ parsedInput }) => {
    const parsedDate = new Date(parsedInput.dueDate);
    const dueDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    if (parsedInput.groupId) {
      const group = await prisma.group.findUnique({ where: { id: parsedInput.groupId } });
      if (!group || group.programId !== parsedInput.programId) {
        throw new Error('The selected group does not belong to the selected program.');
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: parsedInput.title,
        programId: parsedInput.programId,
        groupId: parsedInput.groupId,
        dueDate,
        points: parsedInput.points,
        type: parsedInput.type,
        priority: parsedInput.priority,
      },
    });

    revalidatePath('/admin/assignments');
    revalidatePath('/admin');
    revalidatePath('/dashboard/assignments');
    return { assignmentId: assignment.id };
  });
