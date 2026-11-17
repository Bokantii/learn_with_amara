import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getRunnerState } from '@/lib/assessments/attempt';
import { getRequestActor } from '@/lib/assessments/request-actor';
import { ownsAttempt } from '@/lib/assessments/ownership';
import AttemptRunnerClient from './AttemptRunnerClient';

export const dynamic = 'force-dynamic';

export default async function AttemptRunnerPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  // Public — a signed-in user or an anonymous visitor with the matching
  // claim-token cookie. Nobody else can load this attempt.
  const actor = await getRequestActor();
  const state = await getRunnerState(actor, attemptId);

  if (!state) {
    // Missing, not owned, or already submitted — route the owner to their result,
    // everyone else back to the placement intro.
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, claimTokenHash: true, status: true },
    });
    if (attempt && ownsAttempt(attempt, actor) && attempt.status !== 'IN_PROGRESS') {
      redirect(`/assessments/result/${attemptId}`);
    }
    redirect('/assessments/placement');
  }

  return (
    <AttemptRunnerClient
      attemptId={state.attemptId}
      assessmentTitle={state.assessmentTitle}
      questions={state.questions}
      initialResponses={state.responses}
    />
  );
}
