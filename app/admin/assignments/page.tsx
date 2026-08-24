import { prisma } from '../../../lib/prisma';
import AssignmentsClient from './AssignmentsClient';

export default async function AdminAssignmentsPage() {
  const [assignments, programs, groups] = await Promise.all([
    prisma.assignment.findMany({
      include: { program: true, group: true, _count: { select: { submissions: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.program.findMany({ orderBy: { name: 'asc' } }),
    prisma.group.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const rows = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    programId: assignment.programId,
    programName: assignment.program.name,
    groupId: assignment.groupId,
    groupName: assignment.group?.name ?? null,
    dueDate: assignment.dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    points: assignment.points,
    type: assignment.type,
    priority: assignment.priority as 'high' | 'medium' | 'low',
    submissionCount: assignment._count.submissions,
  }));

  const programOptions = programs.map((program) => ({ id: program.id, name: program.name }));
  const groupOptions = groups.map((group) => ({
    id: group.id,
    name: group.name,
    programId: group.programId,
  }));

  return (
    <AssignmentsClient initialAssignments={rows} programs={programOptions} groups={groupOptions} />
  );
}
