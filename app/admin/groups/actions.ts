'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { adminActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  programId: z.string().min(1, 'Choose a program'),
});

export const createGroupAction = adminActionClient
  .schema(createGroupSchema)
  .action(async ({ parsedInput }) => {
    const group = await prisma.group.create({
      data: { name: parsedInput.name, programId: parsedInput.programId },
    });

    revalidatePath('/admin/groups');
    revalidatePath('/admin');
    return { groupId: group.id };
  });

const deleteGroupSchema = z.object({
  groupId: z.string().min(1),
});

export const deleteGroupAction = adminActionClient
  .schema(deleteGroupSchema)
  .action(async ({ parsedInput }) => {
    await prisma.group.delete({ where: { id: parsedInput.groupId } });

    revalidatePath('/admin/groups');
    revalidatePath('/admin');
    revalidatePath('/admin/assignments');
    return { success: true };
  });

const updateGroupMembersSchema = z.object({
  groupId: z.string().min(1),
  studentIds: z.array(z.string().min(1)),
});

export const updateGroupMembersAction = adminActionClient
  .schema(updateGroupMembersSchema)
  .action(async ({ parsedInput }) => {
    const current = await prisma.groupMembership.findMany({
      where: { groupId: parsedInput.groupId },
      select: { userId: true },
    });
    const currentIds = new Set(current.map((m) => m.userId));
    const desiredIds = new Set(parsedInput.studentIds);

    const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

    await prisma.$transaction([
      ...(toRemove.length > 0
        ? [
            prisma.groupMembership.deleteMany({
              where: { groupId: parsedInput.groupId, userId: { in: toRemove } },
            }),
          ]
        : []),
      ...(toAdd.length > 0
        ? [
            prisma.groupMembership.createMany({
              data: toAdd.map((userId) => ({ groupId: parsedInput.groupId, userId })),
            }),
          ]
        : []),
    ]);

    revalidatePath('/admin/groups');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/assignments');
    return { success: true };
  });
