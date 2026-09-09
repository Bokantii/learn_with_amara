import { prisma } from '../../../lib/prisma';
import AssessmentsClient from './AssessmentsClient';

export default async function AdminAssessmentsPage() {
  const [assessments, programs] = await Promise.all([
    prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        program: { select: { name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.program.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const rows = assessments.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    status: a.status,
    programName: a.program?.name ?? null,
    questionCount: a._count.questions,
    attemptCount: a._count.attempts,
  }));

  return <AssessmentsClient initialAssessments={rows} programs={programs} />;
}
