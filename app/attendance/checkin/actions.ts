'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { authActionClient } from '../../../lib/safe-action';
import { checkInToAttendanceSession } from '../../../lib/attendance/checkin';

/**
 * Student QR check-in (web). The student identity is taken from the session
 * (`ctx.userId`) — never from the request body. Rejection reasons are returned
 * as success data (a discriminated union), not thrown: the repo's
 * `next-safe-action` client has no custom `handleServerError`, so a thrown
 * message would be masked to a generic string and the student could not be
 * told *why* the check-in failed.
 *
 * The mobile app will call `app/api/attendance/checkin/route.ts` instead, which
 * funnels into the exact same `checkInToAttendanceSession` core.
 */

const schema = z.object({ token: z.string().min(1).max(512) });

export const confirmAttendanceCheckInAction = authActionClient
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await checkInToAttendanceSession({
      rawToken: parsedInput.token,
      studentUserId: ctx.userId,
    });

    if (result.ok) {
      revalidatePath('/attendance');
      return { ok: true as const, status: result.status, checkedInAt: result.checkedInAt.toISOString() };
    }

    return { ok: false as const, reason: result.reason, existingStatus: result.existingStatus ?? null };
  });
