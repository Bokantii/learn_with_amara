'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';

/**
 * Admin payment recording (SPEC §11.12, Phase 2 Task 9). Manual records are the
 * institutional workflow — Stripe-confirmed payments arrive via the webhook and
 * are marked `source: STRIPE`. Recording a payment never changes enrollment
 * status: activation is a separate, explicit admin step (decision B).
 */

const CURRENCIES = ['CAD', 'NGN', 'USD', 'GBP'] as const;

const recordPaymentSchema = z.object({
  studentId: z.string().min(1),
  enrollmentId: z.string().min(1).optional(),
  amountCents: z
    .number()
    .int()
    .positive('Amount must be greater than zero.')
    .max(1_000_000_00, 'Amount is too large.'),
  currency: z.enum(CURRENCIES),
  paidAt: z.string().min(1, 'Payment date is required'),
  method: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const recordPaymentAction = adminActionClient
  .schema(recordPaymentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const student = await prisma.user.findUnique({
      where: { id: parsedInput.studentId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new Error('That student could not be found.');
    }

    let programId: string | null = null;
    if (parsedInput.enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: parsedInput.enrollmentId },
        select: { userId: true, programId: true },
      });
      if (!enrollment || enrollment.userId !== student.id) {
        throw new Error('That enrollment does not belong to this student.');
      }
      programId = enrollment.programId;
    }

    const paidAt = new Date(parsedInput.paidAt);
    if (Number.isNaN(paidAt.getTime())) {
      throw new Error('Enter a valid payment date.');
    }
    if (paidAt.getTime() > Date.now()) {
      throw new Error('Payment date cannot be in the future.');
    }

    const payment = await prisma.payment.create({
      data: {
        userId: student.id,
        amountCents: parsedInput.amountCents,
        currency: parsedInput.currency.toLowerCase(),
        status: 'PAID',
        source: 'MANUAL',
        method: parsedInput.method || null,
        reference: parsedInput.reference || null,
        note: parsedInput.note || null,
        programId,
        enrollmentId: parsedInput.enrollmentId ?? null,
        recordedById: ctx.adminId,
        paidAt,
      },
      select: { id: true },
    });

    revalidatePath('/admin/payments');
    revalidatePath('/admin/students');
    revalidatePath('/dashboard/billing');
    return { paymentId: payment.id };
  });

const updatePaymentStatusSchema = z.object({
  paymentId: z.string().min(1),
  status: z.literal('REFUNDED'),
});

export const updatePaymentStatusAction = adminActionClient
  .schema(updatePaymentStatusSchema)
  .action(async ({ parsedInput }) => {
    // Update only — financial history is never deleted (SPEC §11.12). The only
    // supported move is PAID -> REFUNDED.
    const existing = await prisma.payment.findUnique({
      where: { id: parsedInput.paymentId },
      select: { status: true },
    });
    if (!existing) {
      throw new Error('That payment could not be found.');
    }
    if (existing.status !== 'PAID') {
      throw new Error('Only a paid payment can be refunded.');
    }

    await prisma.payment.update({
      where: { id: parsedInput.paymentId },
      data: { status: 'REFUNDED' },
    });

    revalidatePath('/admin/payments');
    revalidatePath('/admin/students');
    revalidatePath('/dashboard/billing');
    return { success: true };
  });
