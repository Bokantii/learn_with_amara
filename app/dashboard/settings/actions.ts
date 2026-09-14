'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authActionClient } from '../../../lib/safe-action';
import { ActionError } from '../../../lib/action-error';
import { prisma } from '../../../lib/prisma';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePasswordAction = authActionClient
  .schema(changePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      // OAuth-only account — it signs in with Google/Facebook and has no
      // password to change (the reset flow also only serves password-backed
      // accounts).
      throw new ActionError('Your account signs in with Google or Facebook and has no password to change.');
    }

    const valid = await bcrypt.compare(parsedInput.currentPassword, user.passwordHash);
    if (!valid) {
      throw new ActionError('Your current password is incorrect.');
    }

    const newHash = await bcrypt.hash(parsedInput.newPassword, 10);
    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: ctx.userId },
        data: { passwordHash: newHash, passwordChangedAt: now },
      }),
      // Evict every session — `getSessionUser`'s `passwordChangedAt` check does
      // the same for the stateless JWTs. The caller is signed out too and must
      // re-authenticate; the Change Password card tells them so.
      prisma.session.deleteMany({ where: { userId: ctx.userId } }),
    ]);
    return { ok: true };
  });
