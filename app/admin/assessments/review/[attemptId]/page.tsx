import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { getReviewDetail } from '../../../../../lib/assessments/review';
import ReviewDetailClient from './ReviewDetailClient';

export default async function AssessmentReviewDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const detail = await getReviewDetail(attemptId);
  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/assessments/review">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Review queue
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{detail.assessmentTitle}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {detail.studentName} · {detail.status === 'GRADED' ? 'graded' : 'awaiting review'}
        </p>
      </div>

      <ReviewDetailClient
        attemptId={detail.attemptId}
        status={detail.status}
        rows={detail.rows}
      />
    </div>
  );
}
