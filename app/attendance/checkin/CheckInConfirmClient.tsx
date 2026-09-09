'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AttendanceStatusBadge, type AttendanceStatusValue,
} from '@/components/AttendanceStatusBadge';
import { confirmAttendanceCheckInAction } from './actions';

type Preview =
  | { ok: true; title: string; instructorName: string; startsAt: string; classStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' }
  | { ok: false };

type Outcome =
  | { kind: 'success'; status: AttendanceStatusValue }
  | { kind: 'already'; status: AttendanceStatusValue | null }
  | { kind: 'error'; message: string };

const REASON_MESSAGE: Record<string, string> = {
  INVALID_OR_EXPIRED: 'This attendance link is invalid or has expired.',
  CLASS_NOT_ELIGIBLE: 'This class is not currently accepting check-ins.',
  NOT_ENTITLED: 'You are not enrolled in this class.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
};

export default function CheckInConfirmClient({
  token,
  preview,
}: {
  token: string | null;
  preview: Preview;
}) {
  const [isPending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  if (!token || !preview.ok) {
    return (
      <Card className="p-6 text-center space-y-2">
        <XCircle className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
        <h1 className="font-semibold text-slate-900">Check-in unavailable</h1>
        <p className="text-sm text-slate-500">This attendance link is invalid or has expired.</p>
      </Card>
    );
  }

  const notAcceptingCheckIns = preview.classStatus !== 'SCHEDULED';

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await confirmAttendanceCheckInAction({ token });
      if (res?.serverError || res?.validationErrors || !res?.data) {
        setOutcome({ kind: 'error', message: res?.serverError ?? 'Something went wrong. Please try again.' });
        return;
      }
      const data = res.data;
      if (data.ok) {
        setOutcome({ kind: 'success', status: data.status });
        return;
      }
      if (data.reason === 'ALREADY_CHECKED_IN') {
        setOutcome({ kind: 'already', status: (data.existingStatus as AttendanceStatusValue | null) ?? null });
        return;
      }
      setOutcome({
        kind: 'error',
        message: REASON_MESSAGE[data.reason] ?? 'This attendance link is invalid or has expired.',
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{preview.title}</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4 text-sky-500" aria-hidden="true" />
            {new Date(preview.startsAt).toLocaleString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
            <span className="text-slate-400">· {preview.instructorName}</span>
          </p>
        </div>

        {!outcome && notAcceptingCheckIns && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-md p-3" role="status">
            This class is not currently accepting check-ins.
          </p>
        )}

        {!outcome && !notAcceptingCheckIns && (
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full h-11 bg-sky-600 hover:bg-sky-700"
          >
            {isPending ? 'Checking in…' : 'Confirm Check-In'}
          </Button>
        )}

        {outcome?.kind === 'success' && (
          <div className="text-center space-y-2" role="status">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" aria-hidden="true" />
            <p className="font-semibold text-slate-900">You are checked in.</p>
            <div className="flex justify-center">
              <AttendanceStatusBadge status={outcome.status} />
            </div>
          </div>
        )}

        {outcome?.kind === 'already' && (
          <div className="text-center space-y-2" role="status">
            <CheckCircle2 className="w-9 h-9 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="font-semibold text-slate-900">You are already checked in.</p>
            {outcome.status && (
              <div className="flex justify-center">
                <AttendanceStatusBadge status={outcome.status} />
              </div>
            )}
          </div>
        )}

        {outcome?.kind === 'error' && (
          <p className="text-sm text-destructive text-center" role="alert">
            {outcome.message}
          </p>
        )}
      </Card>

      <p className="text-center text-sm">
        <Link href="/attendance" className="text-sky-600 hover:underline">
          View my attendance history
        </Link>
      </p>
    </div>
  );
}
