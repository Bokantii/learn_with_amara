import { prisma } from '../../../lib/prisma';
import StudentsClient from './StudentsClient';

export default async function AdminStudentsPage() {
  const [students, programs] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { enrollments: { include: { program: true }, orderBy: { joinedAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.program.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ]);

  const rows = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    joinedDate: student.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    enrollments: student.enrollments.map((e) => ({
      id: e.id,
      programId: e.programId,
      programName: e.program.name,
      status: e.status,
    })),
  }));

  const programOptions = programs.map((program) => ({ id: program.id, name: program.name }));

  return <StudentsClient initialStudents={rows} programs={programOptions} />;
}
