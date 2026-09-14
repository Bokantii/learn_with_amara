import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardCheck, GraduationCap, History } from 'lucide-react';
import { getSessionUser } from '@/lib/authz';
import { CONTENT_ACCESS_ENROLLMENT_STATUSES } from '@/lib/enrollment/status';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StartAssessmentButton } from './StartAssessmentButton';

export const dynamic = 'force-dynamic';

export default async function AssessmentsHubPage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect('/SignIn?callbackUrl=/assessments');
  }

  const [placement, enrollments] = await Promise.all([
    prisma.assessment.findFirst({
      where: { type: 'PLACEMENT', status: 'PUBLISHED' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, description: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id, status: { in: CONTENT_ACCESS_ENROLLMENT_STATUSES } },
      select: { programId: true },
    }),
  ]);
  const programIds = enrollments.map((e) => e.programId);

  const [latestPlacementAttempt, practiceAssessments, openAttempts] = await Promise.all([
    placement
      ? prisma.assessmentAttempt.findFirst({
          where: { userId: user.id, assessmentId: placement.id },
          orderBy: { startedAt: 'desc' },
          select: { id: true, status: true },
        })
      : Promise.resolve(null),
    programIds.length
      ? prisma.assessment.findMany({
          where: { type: 'PRACTICE', status: 'PUBLISHED', programId: { in: programIds } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            program: { select: { name: true } },
            _count: { select: { questions: true } },
          },
        })
      : Promise.resolve([]),
    prisma.assessmentAttempt.findMany({
      where: { userId: user.id, status: 'IN_PROGRESS' },
      select: { id: true, assessmentId: true },
    }),
  ]);

  const openByAssessment = new Map(openAttempts.map((a) => [a.assessmentId, a.id]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Take the placement test to find your level, or work through your programs&apos; practice
          tests.
        </p>
      </div>

      {/* Placement */}
      <Card className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">
              {placement?.title ?? 'French Placement Test'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {placement?.description ??
                'A short diagnostic to estimate your CEFR level and recommend a starting point.'}
            </p>
            {!placement ? (
              <p className="mt-3 text-sm text-slate-500">
                The placement test isn&apos;t available yet. Please check back soon.
              </p>
            ) : latestPlacementAttempt?.status === 'IN_PROGRESS' ? (
              <Button asChild className="mt-4 bg-sky-600 hover:bg-sky-700">
                <Link href={`/assessments/${latestPlacementAttempt.id}`}>Resume placement test</Link>
              </Button>
            ) : latestPlacementAttempt ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button asChild variant="outline">
                  <Link href={`/assessments/result/${latestPlacementAttempt.id}`}>
                    View last result
                  </Link>
                </Button>
                <StartAssessmentButton
                  assessmentId={placement.id}
                  label="Retake"
                  variant="ghost"
                />
              </div>
            ) : (
              <StartAssessmentButton
                assessmentId={placement.id}
                label="Start the placement test"
                className="mt-4 bg-sky-600 hover:bg-sky-700"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Practice */}
      <div>
        <h2 className="font-semibold text-slate-900">Practice tests</h2>
        {practiceAssessments.length === 0 ? (
          <Card className="mt-3 p-6 text-center text-sm text-slate-500">
            No practice tests are available for your programs yet.
          </Card>
        ) : (
          <div className="mt-3 space-y-3">
            {practiceAssessments.map((a) => {
              const openId = openByAssessment.get(a.id);
              return (
                <Card key={a.id} className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{a.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.program?.name} · {a._count.questions} question
                        {a._count.questions === 1 ? '' : 's'}
                      </p>
                    </div>
                    {openId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/assessments/${openId}`}>Resume</Link>
                      </Button>
                    ) : (
                      <StartAssessmentButton assessmentId={a.id} label="Start" size="sm" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/assessments/history"
        className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline"
      >
        <History className="h-4 w-4" aria-hidden="true" />
        View my assessment history
      </Link>
    </div>
  );
}
