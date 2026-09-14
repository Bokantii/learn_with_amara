'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { ActionError } from '../../../lib/action-error';
import { prisma } from '../../../lib/prisma';
import { sendAssignmentGradedNotification } from '../../../lib/notifications/events';
import { notifySafely } from '../../../lib/notifications/safe';

const saveGradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().int().min(0),
  feedback: z.string().trim().optional(),
});

export const saveGradeAction = adminActionClient
  .schema(saveGradeSchema)
  .action(async ({ parsedInput }) => {
    // The schema can't know the assignment's point value, so the ceiling is
    // checked here — a typo like "250" on a 20-point assignment is otherwise
    // accepted and stored (Known Deferred Issue #16).
    const existing = await prisma.submission.findUnique({
      where: { id: parsedInput.submissionId },
      select: { assignment: { select: { points: true } } },
    });
    if (!existing) {
      throw new ActionError('That submission could not be found.');
    }
    if (parsedInput.score > existing.assignment.points) {
      throw new ActionError(
        `Score cannot exceed the assignment's ${existing.assignment.points} points.`
      );
    }

    const submission = await prisma.submission.update({
      where: { id: parsedInput.submissionId },
      data: {
        status: 'GRADED',
        score: parsedInput.score,
        feedback: parsedInput.feedback || null,
      },
      select: { id: true },
    });

    revalidatePath('/admin/grading');
    revalidatePath('/admin');
    revalidatePath('/dashboard/assignments');

    // Grade-posted notification (in-app + email) via the central dispatcher.
    await notifySafely(() => sendAssignmentGradedNotification(submission.id), {
      event: 'assignment-graded',
      submissionId: submission.id,
    });

    return { success: true };
  });
