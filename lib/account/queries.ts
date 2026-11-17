import type { UserStatus } from '../generated/prisma/client';
import { prisma } from '../prisma';

/** Active first, then outstanding invites, then archived accounts. */
const STATUS_ORDER: Record<UserStatus, number> = { ACTIVE: 0, INVITED: 1, DEACTIVATED: 2 };

export async function listAdminStudents(opts: { includeDeactivated: boolean }) {
  const users = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      ...(opts.includeDeactivated ? {} : { status: { not: 'DEACTIVATED' } }),
    },
    // Explicit select — never pull `passwordHash` / audit columns into the RSC.
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      enrollments: {
        select: {
          id: true,
          programId: true,
          status: true,
          program: { select: { name: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return users.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export async function listAdminStaff() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'INSTRUCTOR'] } },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return users.sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name)
  );
}
