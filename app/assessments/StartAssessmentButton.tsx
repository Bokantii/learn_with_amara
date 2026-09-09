'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { startAssessmentAction } from './actions';

const ERROR_MESSAGE: Record<string, string> = {
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
  ASSESSMENT_NOT_FOUND: 'That assessment is no longer available.',
  ASSESSMENT_NOT_PUBLISHED: 'That assessment is not available right now.',
  TYPE_NOT_AVAILABLE: 'That assessment is not available right now.',
  AUTH_REQUIRED: 'Please sign in to take this assessment.',
  NOT_ENTITLED: 'You are not enrolled in the program this test belongs to.',
  NO_QUESTIONS: 'This assessment has no questions yet.',
};

export function StartAssessmentButton({
  assessmentId,
  label,
  className,
  variant,
  size,
}: {
  assessmentId: string;
  label: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await startAssessmentAction({ assessmentId });
      if (res?.serverError || res?.validationErrors || !res?.data) {
        setError(res?.serverError ?? 'Could not start the assessment.');
        return;
      }
      if (!res.data.ok) {
        setError(ERROR_MESSAGE[res.data.error] ?? 'Could not start the assessment.');
        return;
      }
      router.push(`/assessments/${res.data.attemptId}`);
    });
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        onClick={handleClick}
        disabled={isPending}
        className={className}
        variant={variant}
        size={size}
      >
        {isPending ? 'Starting…' : label}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
