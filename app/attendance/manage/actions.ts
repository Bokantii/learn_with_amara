'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { staffActionClient } from '../../../lib/safe-action';
import { prisma } from '../../../lib/prisma';
import { getAppOrigin } from '../../../lib/app-url';
import { isUserEntitledToLiveClass } from '../../../lib/live-class-entitlement';
import {
  startAttendanceSession,
  closeAttendanceSession,
  getAttendanceSessionStatus,
} from '../../../lib/attendance/session';
import { setAttendanceOverride } from '../../../lib/attendance/roster';
import { buildCheckInUrl } from '../../../lib/attendance/url';

/**
 * Attendance-management actions. Authorized for ADMIN *and* INSTRUCTOR via
 * `staffActionClient` (SPEC §4.3 / §11.6). Business-rule guards (class must be
 * SCHEDULED to start attendance) live here, matching how
 * `app/admin/liveclasses/actions.ts` guards inline rather than in the domain lib.
 */

const liveClassIdSchema = z.object({ liveClassId: z.string().min(1) });
const sessionIdSchema = z.object({ sessionId: z.string().min(1) });

export const startAttendanceSessionAction = staffActionClient
  .schema(liveClassIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const liveClass = await prisma.liveClass.findUniqueOrThrow({
      where: { id: parsedInput.liveClassId },
      select: { status: true },
    });
    if (liveClass.status !== 'SCHEDULED') {
      throw new Error('Attendance can only be started for a scheduled class.');
    }

    const { sessionId, rawToken, expiresAt } = await startAttendanceSession(
      parsedInput.liveClassId,
      ctx.staffId
    );

    const checkInUrl = buildCheckInUrl(await getAppOrigin(), rawToken);

    revalidatePath(`/attendance/manage/${parsedInput.liveClassId}`);
    return { sessionId, checkInUrl, expiresAt: expiresAt.toISOString() };
  });

export const closeAttendanceSessionAction = staffActionClient
  .schema(sessionIdSchema)
  .action(async ({ parsedInput }) => {
    const session = await prisma.attendanceSession.findUniqueOrThrow({
      where: { id: parsedInput.sessionId },
      select: { liveClassId: true },
    });

    await closeAttendanceSession(parsedInput.sessionId);

    revalidatePath(`/attendance/manage/${session.liveClassId}`);
    return { success: true };
  });

/** Polled by the manage screen while a session is open. Read-only. */
export const getAttendanceSessionStatusAction = staffActionClient
  .schema(sessionIdSchema)
  .action(async ({ parsedInput }) => {
    const status = await getAttendanceSessionStatus(parsedInput.sessionId);
    return {
      status: status.status,
      expiresAt: status.expiresAt.toISOString(),
      checkedInCount: status.checkedInCount,
      recent: status.recent.map((r) => ({
        studentUserId: r.studentUserId,
        studentName: r.studentName,
        status: r.status,
        checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
      })),
    };
  });

const overrideSchema = z.object({
  liveClassId: z.string().min(1),
  studentUserId: z.string().min(1),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']),
  note: z.string().trim().max(500).optional(),
});

export const setAttendanceOverrideAction = staffActionClient
  .schema(overrideSchema)
  .action(async ({ parsedInput, ctx }) => {
    const liveClass = await prisma.liveClass.findUniqueOrThrow({
      where: { id: parsedInput.liveClassId },
      select: { programId: true, groupId: true },
    });

    // Never let staff manufacture an attendance row for someone who isn't even
    // entitled to the class (the roster only lists entitled students, but the
    // action must not trust that the id came from that list).
    const entitled = await isUserEntitledToLiveClass(parsedInput.studentUserId, liveClass);
    if (!entitled) {
      throw new Error('That student is not entitled to this class.');
    }

    await setAttendanceOverride({
      liveClassId: parsedInput.liveClassId,
      studentUserId: parsedInput.studentUserId,
      status: parsedInput.status,
      overriddenByUserId: ctx.staffId,
      note: parsedInput.note,
    });

    revalidatePath(`/attendance/manage/${parsedInput.liveClassId}`);
    return { success: true };
  });
