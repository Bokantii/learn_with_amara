'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { authActionClient } from '../safe-action';
import { prisma } from '../prisma';

const markReadSchema = z.object({
  notificationId: z.string().min(1),
});

export const markNotificationReadAction = authActionClient
  .schema(markReadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const notification = await prisma.notification.findUnique({
      where: { id: parsedInput.notificationId },
      select: { id: true, recipientUserId: true, readAt: true },
    });

    if (!notification || notification.recipientUserId !== ctx.userId) {
      throw new Error('Notification not found.');
    }

    if (!notification.readAt) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { readAt: new Date() },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
  });
