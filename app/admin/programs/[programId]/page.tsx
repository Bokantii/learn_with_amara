import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import ProgramContentClient from './ProgramContentClient';

export default async function AdminProgramContentPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { resources: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  });

  if (!program) {
    notFound();
  }

  return (
    <ProgramContentClient
      program={{ id: program.id, name: program.name }}
      initialModules={program.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        active: m.active,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          order: l.order,
          durationMinutes: l.durationMinutes,
          videoUrl: l.videoUrl,
          published: l.published,
          resources: l.resources.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            url: r.url,
          })),
        })),
      }))}
    />
  );
}
