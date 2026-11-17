'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { ActionError } from '../../../lib/action-error';
import { prisma } from '../../../lib/prisma';
import {
  createInvitedUser,
  deactivateUser,
  issueInvite,
  reactivateUser,
  revokeInvite,
} from '../../../lib/account/lifecycle';
import { deliverInvite } from '../../../lib/account/invite-delivery';

const ROLE_LABEL: Record<'ADMIN' | 'INSTRUCTOR', string> = {
  ADMIN: 'administrator',
  INSTRUCTOR: 'instructor',
};

async function findStaffOrThrow(userId: string) {
  const staff = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, email: true },
  });
  if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'INSTRUCTOR')) {
    throw new ActionError('That staff account could not be found.');
  }
  return staff as { role: 'ADMIN' | 'INSTRUCTOR'; name: string; email: string };
}

const inviteStaffSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  role: z.enum(['ADMIN', 'INSTRUCTOR']),
});

export const inviteStaffAction = adminActionClient
  .schema(inviteStaffSchema)
  .action(async ({ parsedInput }) => {
    const { userId, rawToken } = await createInvitedUser({
      name: parsedInput.name,
      email: parsedInput.email,
      role: parsedInput.role,
    });

    const delivery = await deliverInvite({
      kind: 'staff',
      name: parsedInput.name,
      email: parsedInput.email.trim().toLowerCase(),
      roleLabel: ROLE_LABEL[parsedInput.role],
      rawToken,
    });

    revalidatePath('/admin/staff');
    return { userId, ...delivery };
  });

const staffIdSchema = z.object({ userId: z.string().min(1) });

export const resendStaffInviteAction = adminActionClient
  .schema(staffIdSchema)
  .action(async ({ parsedInput }) => {
    const staff = await findStaffOrThrow(parsedInput.userId);
    const { rawToken } = await issueInvite(parsedInput.userId);
    const delivery = await deliverInvite({
      kind: 'staff',
      name: staff.name,
      email: staff.email,
      roleLabel: ROLE_LABEL[staff.role],
      rawToken,
    });

    revalidatePath('/admin/staff');
    return delivery;
  });

export const revokeStaffInviteAction = adminActionClient
  .schema(staffIdSchema)
  .action(async ({ parsedInput }) => {
    await findStaffOrThrow(parsedInput.userId);
    await revokeInvite(parsedInput.userId);

    revalidatePath('/admin/staff');
    return { success: true };
  });

const setStaffDeactivatedSchema = z.object({
  userId: z.string().min(1),
  deactivated: z.boolean(),
});

export const setStaffDeactivatedAction = adminActionClient
  .schema(setStaffDeactivatedSchema)
  .action(async ({ parsedInput, ctx }) => {
    await findStaffOrThrow(parsedInput.userId);

    // `deactivateUser` enforces the self-target and last-active-admin guards
    // (and rejects an INVITED account — the client routes those to revoke).
    if (parsedInput.deactivated) {
      await deactivateUser(parsedInput.userId, ctx.adminId);
    } else {
      await reactivateUser(parsedInput.userId);
    }

    revalidatePath('/admin/staff');
    return { success: true };
  });
