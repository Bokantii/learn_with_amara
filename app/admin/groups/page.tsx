import { prisma } from '../../../lib/prisma';
import GroupsClient from './GroupsClient';

export default async function AdminGroupsPage() {
  const [groups, programs, students] = await Promise.all([
    prisma.group.findMany({
      include: { program: true, _count: { select: { members: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.program.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { enrollments: { select: { programId: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const groupRows = groups.map((group) => ({
    id: group.id,
    name: group.name,
    programId: group.programId,
    programName: group.program.name,
    memberCount: group._count.members,
  }));

  const programOptions = programs.map((program) => ({ id: program.id, name: program.name }));

  const studentOptions = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    programIds: student.enrollments.map((e) => e.programId),
  }));

  const memberships = await prisma.groupMembership.findMany({
    select: { groupId: true, userId: true },
  });
  const membersByGroup = new Map<string, string[]>();
  for (const m of memberships) {
    membersByGroup.set(m.groupId, [...(membersByGroup.get(m.groupId) ?? []), m.userId]);
  }

  return (
    <GroupsClient
      initialGroups={groupRows}
      programs={programOptions}
      students={studentOptions}
      membersByGroup={Object.fromEntries(membersByGroup)}
    />
  );
}
