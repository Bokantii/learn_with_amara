import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLACEMENT_RESULT_DISCLAIMER } from '@/lib/assessments/constants';
import { getRequestActor } from '@/lib/assessments/request-actor';
import { StartAssessmentButton } from '../StartAssessmentButton';

export const dynamic = 'force-dynamic';

export default async function PlacementIntroPage() {
  // Public — no sign-in required. The actor is a signed-in user or an anonymous
  // visitor identified by their claim-token cookie.
  const actor = await getRequestActor();

  const placement = await prisma.assessment.findFirst({
    where: { type: 'PLACEMENT', status: 'PUBLISHED' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      questionCount: true,
      _count: { select: { questions: true } },
    },
  });

  if (!placement) {
    return (
      <Card className="p-6 text-center space-y-2">
        <h1 className="font-semibold text-slate-900">Placement test coming soon</h1>
        <p className="text-sm text-slate-500">
          The placement test isn&apos;t available yet. Please check back soon.
        </p>
      </Card>
    );
  }

  const ownWhere = actor.userId
    ? { userId: actor.userId }
    : actor.claimTokenHash
      ? { claimTokenHash: actor.claimTokenHash }
      : null;

  if (ownWhere) {
    const inProgress = await prisma.assessmentAttempt.findFirst({
      where: { ...ownWhere, assessmentId: placement.id, status: 'IN_PROGRESS' },
      select: { id: true },
    });
    if (inProgress) {
      redirect(`/assessments/${inProgress.id}`);
    }
  }

  const lastFinished = ownWhere
    ? await prisma.assessmentAttempt.findFirst({
        where: { ...ownWhere, assessmentId: placement.id, status: { in: ['AWAITING_REVIEW', 'GRADED'] } },
        orderBy: { submittedAt: 'desc' },
        select: { id: true },
      })
    : null;

  const questionCount = Math.min(
    placement.questionCount ?? placement._count.questions,
    placement._count.questions
  );

  return (
    <Card className="p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-slate-900">{placement.title}</h1>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        {placement.description ??
          'A short diagnostic that estimates your level and recommends where to start.'}
      </p>

      <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
        <li>{questionCount} multiple-choice questions across grammar, vocabulary and reading.</li>
        <li>No time limit. Your progress is saved as you go, so you can stop and resume.</li>
        <li>You&apos;ll get an estimated CEFR level and a recommended program at the end.</li>
      </ul>

      <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">{PLACEMENT_RESULT_DISCLAIMER}</p>

      <div className="flex flex-wrap items-center gap-3">
        <StartAssessmentButton
          assessmentId={placement.id}
          label={lastFinished ? 'Start a new attempt' : 'Start the placement test'}
          className="bg-sky-600 hover:bg-sky-700"
        />
        {lastFinished && (
          <Button asChild variant="outline">
            <Link href={`/assessments/result/${lastFinished.id}`}>View last result</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
