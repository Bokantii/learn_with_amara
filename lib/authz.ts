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
