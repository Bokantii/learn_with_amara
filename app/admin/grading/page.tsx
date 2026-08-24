import { prisma } from '../../../lib/prisma';
import GradingClient from './GradingClient';

export default async function AdminGradingPage() {
  const submissions = await prisma.submission.findMany({
    include: {
      student: true,
      assignment: { include: { program: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  const rows = submissions.map((submission) => ({
    id: submission.id,
    studentName: submission.student.name,
    assignmentTitle: submission.assignment.title,
    programName: submission.assignment.program.name,
    submittedDate: submission.submittedAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: submission.status as 'PENDING' | 'GRADED',
    score: submission.score,
    feedback: submission.feedback,
  }));

  return <GradingClient initialSubmissions={rows} />;
}
