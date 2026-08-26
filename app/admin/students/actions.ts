'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';

const addStudentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  programId: z.string().min(1, 'Choose a program'),
});

export const addStudentAction = adminActionClient
  .schema(addStudentSchema)
  .action(async ({ parsedInput }) => {
    const existing = await prisma.user.findUnique({ where: { email: parsedInput.email } });
    if (existing) {
      throw new Error('A user with that email already exists.');
    }

    const student = await prisma.user.create({
      data: {
        name: parsedInput.name,
        email: parsedInput.email,
        role: 'STUDENT',
        enrollments: {
          create: { programId: parsedInput.programId },
        },
      },
    });

    revalidatePath('/admin/students');
    revalidatePath('/admin');
    return { studentId: student.id };
  });

const removeStudentSchema = z.object({
  studentId: z.string().min(1),
});

export const removeStudentAction = adminActionClient
  .schema(removeStudentSchema)
  .action(async ({ parsedInput }) => {
    await prisma.user.delete({ where: { id: parsedInput.studentId } });

    revalidatePath('/admin/students');
    revalidatePath('/admin');
    return { success: true };
  });

const enrollStudentSchema = z.object({
  studentId: z.string().min(1),
  programId: z.string().min(1),
});

export const enrollStudentAction = adminActionClient
  .schema(enrollStudentSchema)
  .action(async ({ parsedInput }) => {
    try {
      await prisma.enrollment.create({
        data: { userId: parsedInput.studentId, programId: parsedInput.programId },
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new Error('This student is already enrolled in that program.');
      }
      throw error;
    }

    revalidatePath('/admin/students');
    revalidatePath('/admin');
    return { success: true };
  });

const updateEnrollmentStatusSchema = z.object({
  enrollmentId: z.string().min(1),
  status: z.enum(['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
});

export const updateEnrollmentStatusAction = adminActionClient
  .schema(updateEnrollmentStatusSchema)
  .action(async ({ parsedInput }) => {
    await prisma.enrollment.update({
      where: { id: parsedInput.enrollmentId },
      data: { status: parsedInput.status },
    });

    revalidatePath('/admin/students');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/myprograms');
    return { success: true };
  });
