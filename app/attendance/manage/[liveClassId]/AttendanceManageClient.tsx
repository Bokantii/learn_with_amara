'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { QrCode, Users, Clock } from 'lucide-react';
import {
  AttendanceStatusBadge, type AttendanceStatusValue,
} from '@/components/AttendanceStatusBadge';
import {
  startAttendanceSessionAction,
  closeAttendanceSessionAction,
  getAttendanceSessionStatusAction,
  setAttendanceOverrideAction,
} from '../actions';

interface RosterRow {
  studentUserId: string;
  name: string;
  email: string;
  status: AttendanceStatusValue;
  checkedInAt: string | null;
  source: 'QR_WEB' | 'ADMIN_OVERRIDE' | null;
  hasRecord: boolean;
}

interface LiveClassProp {
  id: string;
  title: string;
  instructorName: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  programName: string;
  groupName: string | null;
}

interface SessionState {
  id: string;
  checkInUrl: string | null;
  expiresAt: string;
}

const OVERRIDE_OPTIONS: AttendanceStatusValue[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];

function msRemaining(expiresAt: string, now: number) {
  return Math.max(0, new Date(expiresAt).getTime() - now);
}

function formatCountdown(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AttendanceManageClient({
  liveClass,
  openSession,
  initialRoster,
}: {
  liveClass: LiveClassProp;
  openSession: { id: string; expiresAt: string } | null;
  initialRoster: RosterRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // The roster is always server-truth: every mutation ends in router.refresh(),
  // which re-renders this component with a fresh `initialRoster`. No local copy.
  const roster = initialRoster;

  const [session, setSession] = useState<SessionState | null>(
    openSession ? { id: openSession.id, checkInUrl: null, expiresAt: openSession.expiresAt } : null
  );
  const [checkedInCount, setCheckedInCount] = useState<number>(
    initialRoster.filter((r) => r.hasRecord && r.source === 'QR_WEB').length
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expired = session ? msRemaining(session.expiresAt, now) === 0 : false;
  const sessionLive = !!session && !expired;

  // Poll the open session for the live checked-in count; refresh the roster
  // table when new check-ins land. No SSE/WS anywhere in this app.
  const lastCountRef = useRef(checkedInCount);
  useEffect(() => {
    if (!sessionLive || !session) return;
    let cancelled = false;
    const poll = async () => {
      const res = await getAttendanceSessionStatusAction({ sessionId: session.id });
      if (cancelled || !res?.data) return;
      setCheckedInCount(res.data.checkedInCount);
      if (res.data.status !== 'OPEN') {
        setSession(null);
        router.refresh();
        return;
      }
      if (res.data.checkedInCount !== lastCountRef.current) {
        lastCountRef.current = res.data.checkedInCount;
        router.refresh();
      }
    };
    const t = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [sessionLive, session, router]);

  const handleStart = () => {
    setError(null);
    startTransition(async () => {
      const res = await startAttendanceSessionAction({ liveClassId: liveClass.id });
      if (res?.serverError || res?.validationErrors || !res?.data) {
        setError(res?.serverError ?? 'Could not start attendance.');
        return;
      }
      setSession({ id: res.data.sessionId, checkInUrl: res.data.checkInUrl, expiresAt: res.data.expiresAt });
      lastCountRef.current = 0;
      setCheckedInCount(0);
      router.refresh();
    });
  };

  const handleClose = () => {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const res = await closeAttendanceSessionAction({ sessionId: session.id });
      if (res?.serverError) {
        setError(res.serverError);
        return;
      }
      setSession(null);
      router.refresh();
    });
  };

  const handleOverride = useCallback(
    (studentUserId: string, status: AttendanceStatusValue, note: string) => {
      setError(null);
      startTransition(async () => {
        const res = await setAttendanceOverrideAction({
          liveClassId: liveClass.id,
          studentUserId,
          status,
          note: note.trim() || undefined,
        });
        if (res?.serverError || res?.validationErrors) {
          setError(res?.serverError ?? 'Could not save the override.');
          return;
        }
        router.refresh();
      });
    },
    [liveClass.id, router]
  );

  const present = roster.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">{liveClass.title}</h1>
          {liveClass.status === 'CANCELLED' && (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">cancelled</Badge>
          )}
          {liveClass.status === 'COMPLETED' && (
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs">completed</Badge>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {liveClass.programName}
          {liveClass.groupName ? ` · ${liveClass.groupName}` : ''} · {liveClass.instructorName} ·{' '}
          {new Date(liveClass.startsAt).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Session panel */}
      <Card className="p-4 md:p-6">
        {!session && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-sky-600" aria-hidden="true" /> QR attendance
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {liveClass.status === 'SCHEDULED'
                  ? 'Start a session to display a check-in QR. It stays open for 15 minutes.'
                  : 'Attendance can only be started while the class is scheduled.'}
              </p>
            </div>
            <Button
              onClick={handleStart}
              disabled={isPending || liveClass.status !== 'SCHEDULED'}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {isPending ? 'Starting…' : 'Start Attendance'}
            </Button>
          </div>
        )}

        {session && (
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex flex-col items-center gap-2">
              {session.checkInUrl ? (
                <>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <QRCodeSVG
                      value={session.checkInUrl}
                      size={180}
                      role="img"
                      aria-label={`Attendance check-in QR code for ${liveClass.title}. The same link is shown as text below.`}
                      title={`Attendance check-in QR for ${liveClass.title}`}
                    />
                  </div>
                  <p
                    className="text-xs text-slate-400 break-all max-w-[220px] text-center"
                    data-testid="checkin-url"
                  >
                    {session.checkInUrl}
                  </p>
                </>
              ) : (
                <div className="max-w-[220px] text-sm text-slate-500">
                  A session is already open (started on another device). Start a new session to show a
                  QR here.
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-sky-600" aria-hidden="true" />
                {expired ? (
                  <span className="font-medium text-slate-500">Session expired</span>
                ) : (
                  <span className="font-medium tabular-nums">
                    {formatCountdown(msRemaining(session.expiresAt, now))} left
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span className="font-medium">{checkedInCount}</span>
                <span className="text-sm text-slate-500">checked in via QR</span>
              </div>
              <div className="flex gap-2">
                {!expired && (
                  <Button variant="outline" onClick={handleClose} disabled={isPending}>
                    {isPending ? 'Closing…' : 'Close Attendance'}
                  </Button>
                )}
                {liveClass.status === 'SCHEDULED' && (expired || !session.checkInUrl) && (
                  <Button onClick={handleStart} disabled={isPending} className="bg-sky-600 hover:bg-sky-700">
                    {isPending ? 'Starting…' : expired ? 'New session' : 'Start new session (new QR)'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Roster */}
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-slate-900">Roster</h2>
          <p className="text-sm text-slate-500">
            {present}/{roster.length} present or late
          </p>
        </div>
        {roster.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 mt-3">
            No students are currently entitled to this class.
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {roster.map((row) => (
              <RosterRowItem
                key={row.studentUserId}
                row={row}
                disabled={isPending}
                onSave={handleOverride}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RosterRowItem({
  row,
  disabled,
  onSave,
}: {
  row: RosterRow;
  disabled: boolean;
  onSave: (studentUserId: string, status: AttendanceStatusValue, note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<AttendanceStatusValue>(row.status);
  const [note, setNote] = useState('');

  const startEditing = () => {
    setStatus(row.status);
    setNote('');
    setEditing(true);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{row.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {row.email}
            {row.checkedInAt
              ? ` · checked in ${new Date(row.checkedInAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
              : ''}
            {row.source === 'ADMIN_OVERRIDE' ? ' · manual' : ''}
          </p>
        </div>
        <AttendanceStatusBadge status={row.status} />
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing} disabled={disabled}>
            Override
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`status-${row.studentUserId}`} className="text-xs">
              Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatusValue)}>
              <SelectTrigger id={`status-${row.studentUserId}`} className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OVERRIDE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o.charAt(0) + o.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1">
            <Label htmlFor={`note-${row.studentUserId}`} className="text-xs">
              Note (optional)
            </Label>
            <Input
              id={`note-${row.studentUserId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for the override"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onSave(row.studentUserId, status, note);
                setEditing(false);
                setNote('');
              }}
              disabled={disabled}
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setStatus(row.status);
                setNote('');
              }}
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
