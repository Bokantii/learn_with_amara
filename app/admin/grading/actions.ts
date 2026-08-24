'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';
import { resend, EMAIL_FROM } from '../../../lib/email';
import GradePostedEmail from '../../../emails/GradePostedEmail';

const saveGradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().int().min(0),
  feedback: z.string().trim().optional(),
});

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}

export const saveGradeAction = adminActionClient
  .schema(saveGradeSchema)
  .action(async ({ parsedInput }) => {
    const submission = await prisma.submission.update({
      where: { id: parsedInput.submissionId },
      data: {
        status: 'GRADED',
        score: parsedInput.score,
        feedback: parsedInput.feedback || null,
      },
      include: { student: true, assignment: true },
    });

    revalidatePath('/admin/grading');
    revalidatePath('/admin');
    revalidatePath('/dashboard/assignments');

    try {
      const appUrl = await getOrigin();
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: submission.student.email,
        subject: `Your grade for "${submission.assignment.title}" is in`,
        react: GradePostedEmail({
          studentName: submission.student.name,
          assignmentTitle: submission.assignment.title,
          score: parsedInput.score,
          feedback: parsedInput.feedback,
          appUrl,
        }),
      });
      if (error) {
        console.error('Failed to send grade-posted email:', error);
      }
    } catch (error) {
      console.error('Failed to send grade-posted email:', error);
    }

    return { success: true };
  });
