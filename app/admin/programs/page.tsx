import { prisma } from '../../../lib/prisma';
import ProgramsClient from './ProgramsClient';

export default async function AdminProgramsPage() {
  const programs = await prisma.program.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const rows = programs.map((program) => ({
    id: program.id,
    name: program.name,
    track: program.track,
    active: program.active,
    enrollmentCount: program._count.enrollments,
  }));

  return <ProgramsClient initialPrograms={rows} />;
}
