'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { ActionError } from '../../../lib/action-error';
import { prisma } from '../../../lib/prisma';
import { assertTransition, TERMINAL_ENROLLMENT_STATUSES } from '../../../lib/enrollment/status';
import { sendEnrollmentChangedNotification } from '../../../lib/notifications/events';
import { notifySafely } from '../../../lib/notifications/safe';
import {
  createInvitedUser,
  deactivateUser,
  issueInvite,
  reactivateUser,
  revokeInvite,
} from '../../../lib/account/lifecycle';
import { deliverInvite } from '../../../lib/account/invite-delivery';

const addStudentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  programId: z.string().min(1, 'Choose a program'),
});

export const addStudentAction = adminActionClient
  .schema(addStudentSchema)
  .action(async ({ parsedInput }) => {
    // Provision an INVITED account (no password) + a PENDING enrollment, then
    // send the activation link. The account is unusable until the student sets
    // a password via that link.
    const { userId, rawToken } = await createInvitedUser({
      name: parsedInput.name,
      email: parsedInput.email,
      role: 'STUDENT',
      programId: parsedInput.programId,
    });

    const delivery = await deliverInvite({
      kind: 'student',
      name: parsedInput.name,
      email: parsedInput.email.trim().toLowerCase(),
      rawToken,
    });

    revalidatePath('/admin/students');
    revalidatePath('/admin');
    return { studentId: userId, ...delivery };
  });

const studentIdSchema = z.object({ studentId: z.string().min(1) });

async function findStudentOrThrow(studentId: string) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { role: true, name: true, email: true },
  });
  if (!student || student.role !== 'STUDENT') {
    throw new ActionError('That student could not be found.');
  }
  return student;
}

export const resendStudentInviteAction = adminActionClient
  .schema(studentIdSchema)
  .action(async ({ parsedInput }) => {
    const student = await findStudentOrThrow(parsedInput.studentId);
    const { rawToken } = await issueInvite(parsedInput.studentId);
    const delivery = await deliverInvite({
      kind: 'student',
      name: student.name,
      email: student.email,
      rawToken,
    });

    revalidatePath('/admin/students');
    return delivery;
  });

export const revokeStudentInviteAction = adminActionClient
  .schema(studentIdSchema)
  .action(async ({ parsedInput }) => {
    await findStudentOrThrow(parsedInput.studentId);
    await revokeInvite(parsedInput.studentId);

    revalidatePath('/admin/students');
    revalidatePath('/admin');
    return { success: true };
  });

const setDeactivatedSchema = z.object({
  studentId: z.string().min(1),
  deactivated: z.boolean(),
});

export const setStudentDeactivatedAction = adminActionClient
  .schema(setDeactivatedSchema)
  .action(async ({ parsedInput, ctx }) => {
    const target = await prisma.user.findUnique({
      where: { id: parsedInput.studentId },
      select: { role: true },
    });
    // Only a student can be archived through this action — never a staff account.
    if (!target || target.role !== 'STUDENT') {
      throw new ActionError('That student could not be found.');
    }

    if (parsedInput.deactivated) {
      await deactivateUser(parsedInput.studentId, ctx.adminId);
    } else {
      await reactivateUser(parsedInput.studentId);
    }

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
        data: {
          userId: parsedInput.studentId,
          programId: parsedInput.programId,
          status: 'PENDING',
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new ActionError('This student is already enrolled in that program.');
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
    const existing = await prisma.enrollment.findUnique({
      where: { id: parsedInput.enrollmentId },
      select: { status: true },
    });
    if (!existing) {
      throw new ActionError('That enrollment could not be found.');
    }

    // Reject illegal lifecycle moves (e.g. PENDING → PAUSED). Same-status is a
    // no-op and returns without a write.
    assertTransition(existing.status, parsedInput.status);
    if (existing.status === parsedInput.status) {
      return { success: true };
    }

    await prisma.enrollment.update({
      where: { id: parsedInput.enrollmentId },
      data: {
        status: parsedInput.status,
        endedAt: TERMINAL_ENROLLMENT_STATUSES.includes(parsedInput.status)
          ? new Date()
          : null,
      },
    });

    revalidatePath('/admin/students');
    revalidatePath('/admin/payments');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/myprograms');
    revalidatePath('/dashboard/billing');

    // Tell the student their enrollment changed (in-app + email).
    await notifySafely(
      () => sendEnrollmentChangedNotification(parsedInput.enrollmentId, parsedInput.status),
      { event: 'enrollment-changed', enrollmentId: parsedInput.enrollmentId }
    );

    return { success: true };
  });
