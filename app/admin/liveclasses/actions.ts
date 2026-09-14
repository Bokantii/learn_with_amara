'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';
import {
  sendLiveClassCancellation,
  sendLiveClassReschedule,
} from '../../../lib/notifications/liveclass';
import { notifySafely } from '../../../lib/notifications/safe';

async function assertGroupBelongsToProgram(groupId: string | undefined, programId: string) {
  if (!groupId) return;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.programId !== programId) {
    throw new Error('Selected group does not belong to the selected program.');
  }
}

const liveClassFieldsSchema = z.object({
  programId: z.string().min(1),
  groupId: z.string().min(1).optional(),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  instructorName: z.string().trim().min(1, 'Instructor is required'),
  startsAt: z.string().min(1, 'Start time is required'),
  endsAt: z.string().min(1, 'End time is required'),
  meetingUrl: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .refine((v) => /^https?:\/\//i.test(v), 'Meeting URL must start with http:// or https://')
    .optional()
    .or(z.literal('')),
});

function parseAndValidateTimes(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date/time.');
  }
  if (end <= start) {
    throw new Error('End time must be after the start time.');
  }
  return { start, end };
}

export const createLiveClassAction = adminActionClient
  .schema(liveClassFieldsSchema)
  .action(async ({ parsedInput }) => {
    await assertGroupBelongsToProgram(parsedInput.groupId, parsedInput.programId);
    const { start, end } = parseAndValidateTimes(parsedInput.startsAt, parsedInput.endsAt);

    const liveClass = await prisma.liveClass.create({
      data: {
        programId: parsedInput.programId,
        groupId: parsedInput.groupId || null,
        title: parsedInput.title,
        description: parsedInput.description || null,
        instructorName: parsedInput.instructorName,
        startsAt: start,
        endsAt: end,
        meetingUrl: parsedInput.meetingUrl || null,
      },
    });

    revalidatePath('/admin/liveclasses');
    revalidatePath('/dashboard/liveclasses');
    return { liveClassId: liveClass.id };
  });

const updateLiveClassSchema = liveClassFieldsSchema.extend({
  liveClassId: z.string().min(1),
  notifyStudents: z.boolean().optional().default(true),
});

export const updateLiveClassAction = adminActionClient
  .schema(updateLiveClassSchema)
  .action(async ({ parsedInput }) => {
    const existing = await prisma.liveClass.findUniqueOrThrow({
      where: { id: parsedInput.liveClassId },
    });
    if (existing.status !== 'SCHEDULED') {
      throw new Error('Only scheduled classes can be edited.');
    }

    await assertGroupBelongsToProgram(parsedInput.groupId, parsedInput.programId);
    const { start, end } = parseAndValidateTimes(parsedInput.startsAt, parsedInput.endsAt);

    // A reschedule is a change to the START time — that is what invalidates the
    // pending reminder and what students are notified about. An end-time-only
    // edit (correcting the duration) is not a reschedule.
    const rescheduled = start.getTime() !== existing.startsAt.getTime();

    await prisma.liveClass.update({
      where: { id: parsedInput.liveClassId },
      data: {
        programId: parsedInput.programId,
        groupId: parsedInput.groupId || null,
        title: parsedInput.title,
        description: parsedInput.description || null,
        instructorName: parsedInput.instructorName,
        startsAt: start,
        endsAt: end,
        meetingUrl: parsedInput.meetingUrl || null,
        ...(rescheduled ? { rescheduledAt: new Date() } : {}),
      },
    });

    if (rescheduled && parsedInput.notifyStudents) {
      await notifySafely(
        () => sendLiveClassReschedule(parsedInput.liveClassId),
        { action: 'reschedule', liveClassId: parsedInput.liveClassId }
      );
    }

    revalidatePath('/admin/liveclasses');
    revalidatePath('/dashboard/liveclasses');
    return { success: true, rescheduled };
  });

const cancelLiveClassSchema = z.object({
  liveClassId: z.string().min(1),
  cancellationReason: z.enum([
    'NETWORK_ISSUES',
    'INSTRUCTOR_UNAVAILABLE',
    'EMERGENCY',
    'SCHEDULING_CONFLICT',
    'OTHER',
  ]),
  cancellationMessage: z.string().trim().optional(),
  notifyStudents: z.boolean().optional().default(true),
});

export const cancelLiveClassAction = adminActionClient
  .schema(cancelLiveClassSchema)
  .action(async ({ parsedInput }) => {
    const existing = await prisma.liveClass.findUniqueOrThrow({
      where: { id: parsedInput.liveClassId },
      select: { status: true },
    });
    if (existing.status !== 'SCHEDULED') {
      throw new Error('Only scheduled classes can be cancelled.');
    }

    await prisma.liveClass.update({
      where: { id: parsedInput.liveClassId },
      data: {
        status: 'CANCELLED',
        cancellationReason: parsedInput.cancellationReason,
        cancellationMessage: parsedInput.cancellationMessage || null,
      },
    });

    if (parsedInput.notifyStudents) {
      await notifySafely(
        () => sendLiveClassCancellation(parsedInput.liveClassId),
        { action: 'cancel', liveClassId: parsedInput.liveClassId }
      );
    }

    revalidatePath('/admin/liveclasses');
    revalidatePath('/dashboard/liveclasses');
    return { success: true };
  });

const markCompletedSchema = z.object({
  liveClassId: z.string().min(1),
});

export const markLiveClassCompletedAction = adminActionClient
  .schema(markCompletedSchema)
  .action(async ({ parsedInput }) => {
    await prisma.liveClass.update({
      where: { id: parsedInput.liveClassId },
      data: { status: 'COMPLETED' },
    });

    revalidatePath('/admin/liveclasses');
    revalidatePath('/dashboard/liveclasses');
    return { success: true };
  });
