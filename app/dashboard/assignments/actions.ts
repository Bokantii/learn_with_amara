'use server';

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { getSessionUser } from '../../../lib/authz';
import { prisma } from '../../../lib/prisma';

export async function submitAssignmentAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.id) {
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
    where: { studentId: user.id, assignmentId },
  });
  if (existing) {
    return { error: 'You already submitted this assignment.' };
  }

  let fileUrl: string;
  try {
    const blob = await put(
      `submissions/${user.id}/${assignmentId}-${file.name}`,
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
      studentId: user.id,
      assignmentId,
      fileUrl,
    },
  });

  revalidatePath('/dashboard/assignments');
  revalidatePath('/admin/grading');
  revalidatePath('/admin');

  return { success: true };
}
