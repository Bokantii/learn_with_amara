import { prisma } from '../../../lib/prisma';
import StudentsClient from './StudentsClient';

export default async function AdminStudentsPage() {
  const [students, programs] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { enrollments: { include: { program: true }, take: 1 } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.program.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const rows = students.map((student) => {
    const enrollment = student.enrollments[0];
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      programId: enrollment?.programId ?? '',
      status: (enrollment?.status ?? 'ACTIVE') as 'ACTIVE' | 'PAUSED',
      joinedDate: student.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  });

  const programOptions = programs.map((program) => ({ id: program.id, name: program.name }));

  return <StudentsClient initialStudents={rows} programs={programOptions} />;
}
