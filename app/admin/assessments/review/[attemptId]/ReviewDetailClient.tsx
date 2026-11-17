'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Badge } from '../../../../../components/ui/badge';
import { gradeAssessmentResponseAction, finalizeAttemptAction } from '../../actions';

interface Row {
  responseId: string | null;
  questionId: string;
  prompt: string;
  maxPoints: number;
  textResponse: string | null;
  awardedPoints: number | null;
  graderFeedback: string | null;
}

export default function ReviewDetailClient({
  attemptId,
  status,
  rows,
}: {
  attemptId: string;
  status: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allGraded = rows.every((r) => r.awardedPoints != null);
  const readOnly = status === 'GRADED';

  const grade = (row: Row, points: number, feedback: string) => {
    setError(null);
    startTransition(async () => {
      const res = await gradeAssessmentResponseAction({
        attemptId,
        questionId: row.questionId,
        awardedPoints: points,
        feedback: feedback || undefined,
      });
      if (res?.serverError || res?.validationErrors || !res?.data?.ok) {
        setError(res?.serverError ?? 'Could not save that grade (check the points range).');
        return;
      }
      router.refresh();
    });
  };

  const finalize = () => {
    setError(null);
    startTransition(async () => {
      const res = await finalizeAttemptAction({ attemptId });
      if (res?.serverError || !res?.data?.ok) {
        setError(res?.serverError ?? 'Could not finalize — grade every question first.');
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {rows.map((row, i) => (
        <Card key={row.questionId} className="p-4 md:p-5 space-y-3">
          <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
            {i + 1}. {row.prompt}
          </p>
          <div>
            <p className="text-xs text-slate-500">Student answer</p>
            <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded p-3 mt-1">
              {row.textResponse || <span className="text-slate-400">(no answer)</span>}
            </p>
          </div>
          {readOnly ? (
            <p className="text-sm text-slate-600">
              <Badge className="bg-emerald-50 text-emerald-700">
                {row.awardedPoints}/{row.maxPoints} pts
              </Badge>
              {row.graderFeedback ? ` — ${row.graderFeedback}` : ''}
            </p>
          ) : (
            <GradeRow row={row} isPending={isPending} onSave={grade} />
          )}
        </Card>
      ))}

      {!readOnly && (
        <Button
          onClick={finalize}
          disabled={isPending || !allGraded}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isPending ? 'Working…' : 'Finalize & release result'}
        </Button>
      )}
      {readOnly && <p className="text-sm text-emerald-700">Result finalized and released to the student.</p>}
    </div>
  );
}

function GradeRow({
  row,
  isPending,
  onSave,
}: {
  row: Row;
  isPending: boolean;
  onSave: (row: Row, points: number, feedback: string) => void;
}) {
  const [points, setPoints] = useState(row.awardedPoints != null ? String(row.awardedPoints) : '');
  const [feedback, setFeedback] = useState(row.graderFeedback ?? '');

  return (
    <form
      className="grid sm:grid-cols-[110px_1fr_auto] gap-3 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(row, Number(points), feedback);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`pts-${row.questionId}`} className="text-xs">
          Points (0–{row.maxPoints})
        </Label>
        <Input
          id={`pts-${row.questionId}`}
          type="number"
          min={0}
          max={row.maxPoints}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          required
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`fb-${row.questionId}`} className="text-xs">Feedback</Label>
        <Textarea
          id={`fb-${row.questionId}`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-9 h-9"
          placeholder="Optional"
        />
      </div>
      <Button type="submit" size="sm" className="mt-5 bg-violet-600 hover:bg-violet-700" disabled={isPending}>
        {row.awardedPoints != null ? 'Update' : 'Save'}
      </Button>
    </form>
  );
}
