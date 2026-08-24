'use server';

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { auth } from '../../../auth';
import { prisma } from '../../../lib/prisma';

export async function submitAssignmentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be signed in to submit an assignment.' };
  }

  const assignmentId = formData.get('assignmentId');
  const file = formData.get('file');

  if (typeof assignmentId !== 'string' || !assignmentId) {
    return { error: 'Missing assignment.' };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Please choose a file to upload.' };
  }

  const existing = await prisma.submission.findFirst({
    where: { studentId: session.user.id, assignmentId },
  });
  if (existing) {
    return { error: 'You already submitted this assignment.' };
  }

  let fileUrl: string;
  try {
    const blob = await put(
      `submissions/${session.user.id}/${assignmentId}-${file.name}`,
      file,
      { access: 'public', addRandomSuffix: true }
    );
    fileUrl = blob.url;
  } catch (error) {
    console.error('Failed to upload submission file:', error);
    return { error: 'Could not upload your file. Please try again.' };
  }

  await prisma.submission.create({
    data: {
      studentId: session.user.id,
      assignmentId,
      fileUrl,
    },
  });

  revalidatePath('/dashboard/assignments');
  revalidatePath('/admin/grading');
  revalidatePath('/admin');

  return { success: true };
}
