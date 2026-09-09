import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { getSessionUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getResultState } from '@/lib/assessments/attempt';
import { getRequestActor } from '@/lib/assessments/request-actor';
import { PLACEMENT_RESULT_DISCLAIMER } from '@/lib/assessments/constants';
import { cefrLabel } from '@/lib/assessments/placement';
import { recommendTrack } from '@/lib/assessments/recommendation';

export const dynamic = 'force-dynamic';

const SKILL_LABEL: Record<string, string> = {
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  // Public — a signed-in user or an anonymous visitor with the matching
  // claim-token cookie.
  const [actor, user] = await Promise.all([getRequestActor(), getSessionUser()]);
  const result = await getResultState(actor, attemptId);
  if (!result) {
    redirect('/assessments/placement');
  }
  const signedIn = !!user?.id;

  const isPlacement = result.assessmentType === 'PLACEMENT';
  const awaiting = result.status === 'AWAITING_REVIEW';

  const autoPct =
    result.autoMaxPoints && result.autoMaxPoints > 0
      ? Math.round((result.autoScorePoints ?? 0) / result.autoMaxPoints * 100)
      : 0;

  const rec = isPlacement ? recommendTrack(result.estimatedCefr) : null;
  const recProgram = rec
    ? await prisma.program.findFirst({
        where: { track: rec.track, active: true },
        select: { name: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={signedIn ? '/assessments' : '/'}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          {signedIn ? '← All assessments' : '← Back to ICLP'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">{result.assessmentTitle}</h1>
        {result.submittedAt && (
          <p className="text-sm text-slate-500 mt-1">
            Submitted {result.submittedAt.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {awaiting && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-800" role="status">
          Your written answers are being reviewed by an instructor. The auto-scored section is shown
          below; your final result will appear here once review is complete.
        </Card>
      )}

      {/* Headline */}
      {isPlacement ? (
        <Card className="p-6 text-center space-y-2">
          <p className="text-sm text-slate-500">Estimated level</p>
          <p className="text-3xl font-bold text-sky-700">{cefrLabel(result.estimatedCefr)}</p>
          <p className="text-sm text-slate-600">{autoPct}% of questions correct</p>
        </Card>
      ) : (
        <Card className="p-6 text-center space-y-2">
          <p className="text-sm text-slate-500">Score</p>
          <p className="text-3xl font-bold text-sky-700">
            {(result.autoScorePoints ?? 0) + (result.manualScorePoints ?? 0)}
            {' / '}
            {(result.autoMaxPoints ?? 0) + (result.manualMaxPoints ?? 0)}
          </p>
        </Card>
      )}

      {/* Placement: CEFR ladder */}
      {isPlacement && result.levelTallies.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">How your level was estimated</h2>
          <p className="text-xs text-slate-500 mt-1">
            You clear a level by answering at least 70% of its questions correctly, with every lower
            level also cleared.
          </p>
          <ul className="mt-3 divide-y divide-slate-100">
            {result.levelTallies.map((t) => {
              const cleared = t.total > 0 && t.correct / t.total >= 0.7;
              return (
                <li key={t.level} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-slate-700">{t.level}</span>
                  <span className="flex items-center gap-2 text-slate-600">
                    {t.correct}/{t.total}
                    {cleared ? (
                      <Check className="h-4 w-4 text-emerald-500" role="img" aria-label="cleared" />
                    ) : (
                      <X className="h-4 w-4 text-slate-400" role="img" aria-label="not cleared" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Skill breakdown */}
      {result.skillBreakdown.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">By skill</h2>
          <ul className="mt-3 space-y-2">
            {result.skillBreakdown.map((s) => (
              <li key={s.skill} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">{SKILL_LABEL[s.skill] ?? s.skill}</span>
                  <span className="text-slate-500">
                    {s.correct}/{s.total} · {s.percentage}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${s.percentage}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendation */}
      {isPlacement && rec && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Recommended next step</h2>
          <p className="text-sm text-slate-700 mt-1 font-medium">
            {recProgram?.name ?? rec.headline}
          </p>
          <p className="text-sm text-slate-500 mt-1">{rec.rationale}</p>
        </Card>
      )}

      {/* What's next */}
      {isPlacement && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">What&apos;s next</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <Link href="/Courses">Browse programs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/Pricing">See pricing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/Pricing">Get started</Link>
            </Button>
          </div>
          {signedIn && (
            <p className="mt-3 text-sm">
              <Link href="/assessments/history" className="text-sky-600 hover:underline">
                My assessment history
              </Link>
            </p>
          )}
        </Card>
      )}

      {/* Per-question review */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900">Review</h2>
        <ol className="mt-3 space-y-4">
          {result.review.map((q, i) => {
            return (
              <li key={q.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-400 mt-0.5">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 whitespace-pre-line">{q.prompt}</p>

                    {q.type === 'SINGLE_CHOICE' ? (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((o) => {
                          const picked = o.id === q.yourOptionId;
                          return (
                            <li
                              key={o.id}
                              className={`text-sm rounded px-2 py-1 ${
                                o.isCorrect
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : picked
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-slate-600'
                              }`}
                            >
                              {o.text}
                              {o.isCorrect && ' · correct answer'}
                              {picked && !o.isCorrect && ' · your answer'}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="mt-2 text-sm">
                        <p className="text-slate-500 text-xs">Your answer</p>
                        <p className="text-slate-700 whitespace-pre-line bg-slate-50 rounded p-2">
                          {q.yourText || <span className="text-slate-400">(no answer)</span>}
                        </p>
                        {q.awardedPoints != null ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {q.awardedPoints}/{q.maxPoints ?? 1} points
                            {q.graderFeedback ? ` — ${q.graderFeedback}` : ''}
                          </p>
                        ) : (
                          <Badge className="mt-1 bg-amber-100 text-amber-800 text-xs">
                            Awaiting review
                          </Badge>
                        )}
                      </div>
                    )}

                    {q.explanation && q.type === 'SINGLE_CHOICE' && (
                      <p className="mt-2 text-xs text-slate-500">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {isPlacement && (
        <p className="text-xs text-slate-500">{PLACEMENT_RESULT_DISCLAIMER}</p>
      )}
    </div>
  );
}
