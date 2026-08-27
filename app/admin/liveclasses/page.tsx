import { prisma } from '../../../lib/prisma';
import LiveClassesClient from './LiveClassesClient';

export default async function AdminLiveClassesPage() {
  const [liveClasses, programs, groups] = await Promise.all([
    prisma.liveClass.findMany({
      include: { program: true, group: true },
      orderBy: { startsAt: 'desc' },
    }),
    prisma.program.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.group.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const rows = liveClasses.map((lc) => ({
    id: lc.id,
    programId: lc.programId,
    programName: lc.program.name,
    groupId: lc.groupId,
    groupName: lc.group?.name ?? null,
    title: lc.title,
    description: lc.description,
    instructorName: lc.instructorName,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    meetingUrl: lc.meetingUrl,
    status: lc.status,
    cancellationReason: lc.cancellationReason,
    cancellationMessage: lc.cancellationMessage,
    rescheduledAt: lc.rescheduledAt ? lc.rescheduledAt.toISOString() : null,
  }));

  const programOptions = programs.map((p) => ({ id: p.id, name: p.name }));
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name, programId: g.programId }));

  return (
    <LiveClassesClient
      initialLiveClasses={rows}
      programs={programOptions}
      groups={groupOptions}
    />
  );
}
