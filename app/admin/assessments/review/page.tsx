import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { getReviewQueue } from '../../../../lib/assessments/review';

export default async function AssessmentReviewQueuePage() {
  const queue = await getReviewQueue();

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/assessments">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Assessments
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Needs review</h1>
        <p className="text-sm text-slate-500 mt-1">
          Attempts with written answers waiting to be graded.
        </p>
      </div>

      {queue.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">Nothing waiting for review.</Card>
      ) : (
        <div className="space-y-3">
          {queue.map((a) => (
            <Link key={a.id} href={`/admin/assessments/review/${a.id}`} className="block">
              <Card className="p-4 hover:shadow-md transition-shadow">
                <p className="font-medium text-slate-900">{a.assessment.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.user?.name ?? 'Unknown student'}{a.user?.email ? ` (${a.user.email})` : ''}
                  {a.submittedAt
                    ? ` · submitted ${a.submittedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : ''}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
