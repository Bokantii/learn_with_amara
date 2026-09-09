import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import AssessmentEditorClient from './AssessmentEditorClient';

export default async function AdminAssessmentEditorPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  const [assessment, programs] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    prisma.program.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  if (!assessment) {
    notFound();
  }

  return (
    <AssessmentEditorClient
      programs={programs}
      assessment={{
        id: assessment.id,
        type: assessment.type,
        title: assessment.title,
        description: assessment.description,
        status: assessment.status,
        programId: assessment.programId,
        questionCount: assessment.questionCount,
        passPercentage: assessment.passPercentage,
        questions: assessment.questions.map((q) => ({
          id: q.id,
          type: q.type,
          skill: q.skill,
          cefrLevel: q.cefrLevel,
          order: q.order,
          active: q.active,
          prompt: q.prompt,
          explanation: q.explanation,
          maxPoints: q.maxPoints,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        })),
      }}
    />
  );
}
