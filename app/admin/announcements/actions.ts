'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';
import { sendAnnouncementNotification } from '../../../lib/announcements/notify';
import { notifySafely } from '../../../lib/notifications/safe';

/**
 * Announcement management (SPEC §11.11). All `adminActionClient` — students have
 * no path here. The `(scope, target)` pairing is validated server-side; the
 * client never dictates ownership. A published announcement is archived, never
 * deleted, so already-delivered context is preserved.
 */

function revalidate() {
  revalidatePath('/admin/announcements');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/announcements');
}

const createSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(160),
    body: z.string().trim().min(1, 'Body is required').max(5000),
    scope: z.enum(['ALL', 'PROGRAM', 'GROUP', 'STUDENT']),
    programId: z.string().min(1).optional(),
    groupId: z.string().min(1).optional(),
    studentId: z.string().min(1).optional(),
  })
  .refine(
    (v) =>
      (v.scope === 'ALL') ||
      (v.scope === 'PROGRAM' && !!v.programId) ||
      (v.scope === 'GROUP' && !!v.groupId) ||
      (v.scope === 'STUDENT' && !!v.studentId),
    { message: 'Choose a target for that scope.' }
  );

export const createAnnouncementAction = adminActionClient
  .schema(createSchema)
  .action(async ({ parsedInput, ctx }) => {
    let programId: string | null = null;
    let groupId: string | null = null;
    let studentId: string | null = null;

    if (parsedInput.scope === 'PROGRAM') {
      const program = await prisma.program.findUnique({
        where: { id: parsedInput.programId! },
        select: { id: true },
      });
      if (!program) throw new Error('That program could not be found.');
      programId = program.id;
    } else if (parsedInput.scope === 'GROUP') {
      const group = await prisma.group.findUnique({
        where: { id: parsedInput.groupId! },
        select: { id: true },
      });
      if (!group) throw new Error('That group could not be found.');
      groupId = group.id;
    } else if (parsedInput.scope === 'STUDENT') {
      const student = await prisma.user.findUnique({
        where: { id: parsedInput.studentId! },
        select: { id: true, role: true },
      });
      if (!student || student.role !== 'STUDENT') {
        throw new Error('That student could not be found.');
      }
      studentId = student.id;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: parsedInput.title,
        body: parsedInput.body,
        scope: parsedInput.scope,
        programId,
        groupId,
        studentId,
        createdById: ctx.adminId,
      },
      select: { id: true },
    });

    revalidate();
    return { announcementId: announcement.id };
  });

const idSchema = z.object({ announcementId: z.string().min(1) });

export const publishAnnouncementAction = adminActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const existing = await prisma.announcement.findUnique({
      where: { id: parsedInput.announcementId },
      select: { publishedAt: true, archivedAt: true },
    });
    if (!existing) throw new Error('That announcement could not be found.');
    if (existing.archivedAt) throw new Error('An archived announcement cannot be published.');

    if (!existing.publishedAt) {
      await prisma.announcement.update({
        where: { id: parsedInput.announcementId },
        data: { publishedAt: new Date() },
      });
    }

    // Deliver through the central notification system (dedupe makes a repeat safe).
    await notifySafely(() => sendAnnouncementNotification(parsedInput.announcementId), {
      event: 'announcement-published',
      announcementId: parsedInput.announcementId,
    });

    revalidate();
    return { success: true };
  });

const editSchema = z.object({
  announcementId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(5000),
});

export const updateAnnouncementAction = adminActionClient
  .schema(editSchema)
  .action(async ({ parsedInput }) => {
    // Editing after publish updates the record but does not re-notify.
    await prisma.announcement.update({
      where: { id: parsedInput.announcementId },
      data: { title: parsedInput.title, body: parsedInput.body },
    });
    revalidate();
    return { success: true };
  });

const archiveSchema = z.object({
  announcementId: z.string().min(1),
  archived: z.boolean(),
});

export const setAnnouncementArchivedAction = adminActionClient
  .schema(archiveSchema)
  .action(async ({ parsedInput }) => {
    await prisma.announcement.update({
      where: { id: parsedInput.announcementId },
      data: { archivedAt: parsedInput.archived ? new Date() : null },
    });
    revalidate();
    return { success: true };
  });

export const deleteAnnouncementAction = adminActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const existing = await prisma.announcement.findUnique({
      where: { id: parsedInput.announcementId },
      select: { publishedAt: true },
    });
    if (!existing) throw new Error('That announcement could not be found.');
    if (existing.publishedAt) {
      throw new Error('A published announcement is archived, not deleted.');
    }
    await prisma.announcement.delete({ where: { id: parsedInput.announcementId } });
    revalidate();
    return { success: true };
  });
