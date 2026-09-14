import { cache } from 'react';
import { auth } from '../auth';
import { prisma } from './prisma';
import { canSignIn } from './account/status';
import {
  CONTENT_ACCESS_ENROLLMENT_STATUSES,
  VISIBLE_ENROLLMENT_STATUSES,
} from './enrollment/status';

/**
 * The single gate every protected surface funnels through (layouts, the
 * `next-safe-action` clients, the attendance-manage pages). Beyond decoding the
 * JWT session it re-reads the account's authoritative `status` and `role` so a
 * deactivation or a role change takes effect on the very next request instead of
 * whenever the JWT happens to refresh. Wrapped in React `cache` so the extra
 * primary-key lookup runs at most once per render (SPEC §5.5).
 *
 * Returns `null` for an archived / not-yet-activated account — callers then
 * treat it exactly like a signed-out visitor (redirect to `/SignIn`).
 */
export const getSessionUser = cache(async () => {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const account = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true, status: true, name: true, email: true, passwordChangedAt: true },
  });
  if (!account || !canSignIn(account.status)) return null;

  // A password reset / change stamps `passwordChangedAt`; a JWT minted before
  // that instant is stale (e.g. a session the reset was meant to evict).
  if (
    account.passwordChangedAt &&
    sessionUser.tokenIssuedAt != null &&
    account.passwordChangedAt.getTime() > sessionUser.tokenIssuedAt * 1000
  ) {
    return null;
  }

  return {
    ...sessionUser,
    role: account.role,
    name: account.name ?? sessionUser.name,
    email: account.email ?? sessionUser.email,
  };
});

/** ADMIN or INSTRUCTOR — the roles allowed to run/manage live-class attendance. */
export function isStaff(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
}

/**
 * Does the student have any enrollment they can SEE (anything but CANCELLED)?
 * Gates the dashboard shell — a PENDING / PAUSED / COMPLETED student still gets
 * the dashboard (billing, my programs, …), just not course content.
 */
export async function hasVisibleEnrollment(userId: string) {
  const count = await prisma.enrollment.count({
    where: { userId, status: { in: VISIBLE_ENROLLMENT_STATUSES } },
  });
  return count > 0;
}

/**
 * May the student OPEN a program's content (lessons, assignments, practice
 * tests)? Only an ACTIVE or COMPLETED enrollment — a PENDING (not yet
 * activated) or PAUSED enrollment can be seen but not used (SPEC §6, Task 9).
 */
export async function hasProgramAccess(userId: string, programId: string) {
  const count = await prisma.enrollment.count({
    where: { userId, programId, status: { in: CONTENT_ACCESS_ENROLLMENT_STATUSES } },
  });
  return count > 0;
}

/**
 * Returns the lesson (with its module and program id) only if it's published
 * AND the user is entitled to its program — otherwise null. This is the single
 * source of truth for both reading lesson content and mutating progress on it,
 * so a manually-guessed lessonId can never leak unpublished or unentitled content.
 */
export async function getEntitledPublishedLesson(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { program: true } } },
  });

  if (!lesson || !lesson.published) return null;

  const entitled = await hasProgramAccess(userId, lesson.module.programId);
  if (!entitled) return null;

  return lesson;
}
