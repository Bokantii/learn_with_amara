'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { StudentQuestion } from '@/lib/assessments/serialize';
import { saveAssessmentResponseAction, submitAssessmentAttemptAction } from '../actions';

interface AnswerState {
  selectedOptionId: string | null;
  textResponse: string | null;
}

export default function AttemptRunnerClient({
  attemptId,
  assessmentTitle,
  questions,
  initialResponses,
}: {
  attemptId: string;
  assessmentTitle: string;
  questions: StudentQuestion[];
  initialResponses: Record<string, { selectedOptionId: string | null; textResponse: string | null }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const seed: Record<string, AnswerState> = {};
    for (const q of questions) {
      const r = initialResponses[q.id];
      seed[q.id] = {
        selectedOptionId: r?.selectedOptionId ?? null,
        textResponse: r?.textResponse ?? null,
      };
    }
    return seed;
  });

  const total = questions.length;
  const question = questions[index];
  const answer = answers[question.id];
  const isLast = index === total - 1;
  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers[q.id];
        return !!a?.selectedOptionId || !!a?.textResponse?.trim();
      }).length,
    [questions, answers]
  );

  const setAnswer = (patch: Partial<AnswerState>) => {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], ...patch } }));
  };

  const persist = async (): Promise<boolean> => {
    const current = answers[question.id];
    if (!current.selectedOptionId && !current.textResponse?.trim()) return true; // nothing to save
    const res = await saveAssessmentResponseAction({
      attemptId,
      questionId: question.id,
      selectedOptionId: current.selectedOptionId ?? undefined,
      textResponse: current.textResponse ?? undefined,
    });
    if (res?.serverError || res?.validationErrors || !res?.data?.ok) {
      setError('Could not save your answer. Check your connection and try again.');
      return false;
    }
    return true;
  };

  const goPrev = () => {
    setError(null);
    startTransition(async () => {
      if (await persist()) setIndex((i) => Math.max(0, i - 1));
    });
  };

  const goNext = () => {
    setError(null);
    startTransition(async () => {
      if (await persist()) setIndex((i) => Math.min(total - 1, i + 1));
    });
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      if (!(await persist())) return;
      const res = await submitAssessmentAttemptAction({ attemptId });
      if (res?.serverError || res?.validationErrors || !res?.data?.ok) {
        setError('Could not submit. Please try again.');
        return;
      }
      router.push(`/assessments/result/${attemptId}`);
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{assessmentTitle}</h1>
        <div className="mt-2 flex items-center gap-3">
          <Progress
            value={((index + 1) / total) * 100}
            className="h-2 bg-slate-200"
            aria-label={`Question ${index + 1} of ${total}`}
          />
          <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
            {index + 1} / {total}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{answeredCount} of {total} answered</p>
      </div>

      <Card className="p-5 md:p-6 space-y-4">
        <p className="font-medium text-slate-900 whitespace-pre-line">{question.prompt}</p>

        {question.type === 'SINGLE_CHOICE' ? (
          <RadioGroup
            value={answer.selectedOptionId ?? ''}
            onValueChange={(v) => setAnswer({ selectedOptionId: v, textResponse: null })}
            aria-label="Answer options"
          >
            {question.options.map((opt) => (
              <label
                key={opt.id}
                htmlFor={`opt-${opt.id}`}
                className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50"
              >
                <RadioGroupItem id={`opt-${opt.id}`} value={opt.id} className="mt-0.5" />
                <span className="text-sm text-slate-800">{opt.text}</span>
              </label>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="text-answer" className="text-xs text-slate-500">
              Your answer
            </Label>
            <Textarea
              id="text-answer"
              value={answer.textResponse ?? ''}
              onChange={(e) => setAnswer({ textResponse: e.target.value, selectedOptionId: null })}
              rows={question.type === 'ESSAY' ? 8 : 3}
              placeholder="Type your answer…"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goPrev} disabled={isPending || index === 0}>
          Previous
        </Button>
        {isLast ? (
          <Button onClick={submit} disabled={isPending} className="bg-sky-600 hover:bg-sky-700">
            {isPending ? 'Submitting…' : 'Submit'}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={isPending} className="bg-sky-600 hover:bg-sky-700">
            {isPending ? 'Saving…' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}
