import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/authz';
import { listStudentAttempts } from '@/lib/assessments/attempt';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cefrLabel } from '@/lib/assessments/placement';

export const dynamic = 'force-dynamic';

export default async function AssessmentHistoryPage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect('/SignIn?callbackUrl=/assessments/history');
  }

  const attempts = await listStudentAttempts(user.id);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/assessments" className="text-sm text-slate-500 hover:text-slate-900">
          ← All assessments
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">My assessment history</h1>
      </div>

      {attempts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          You haven&apos;t completed any assessments yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const totalScore = (a.autoScorePoints ?? 0) + (a.manualScorePoints ?? 0);
            const totalMax = (a.autoMaxPoints ?? 0) + (a.manualMaxPoints ?? 0);
            return (
              <Link key={a.id} href={`/assessments/result/${a.id}`} className="block">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{a.assessment.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.assessment.type === 'PLACEMENT' ? 'Placement' : 'Practice'}
                        {a.submittedAt
                          ? ` · ${a.submittedAt.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}`
                          : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      {a.status === 'AWAITING_REVIEW' ? (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">Awaiting review</Badge>
                      ) : a.assessment.type === 'PLACEMENT' ? (
                        <span className="text-sm font-semibold text-sky-700">
                          {cefrLabel(a.estimatedCefr)}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-sky-700">
                          {totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : '—'}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
