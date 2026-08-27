import { auth } from '../auth';
import { prisma } from './prisma';

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function hasActiveEnrollment(userId: string) {
  const count = await prisma.enrollment.count({
    where: { userId, status: 'ACTIVE' },
  });
  return count > 0;
}

/** Any enrollment other than CANCELLED grants read access to a program's content. */
export async function hasProgramAccess(userId: string, programId: string) {
  const count = await prisma.enrollment.count({
    where: { userId, programId, status: { not: 'CANCELLED' } },
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
