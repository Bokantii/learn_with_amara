import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionUser, isStaff } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { getAttendanceRoster } from '@/lib/attendance/roster';
import AttendanceManageClient from './AttendanceManageClient';

export const dynamic = 'force-dynamic';

export default async function AttendanceManagePage({
  params,
}: {
  params: Promise<{ liveClassId: string }>;
}) {
  const user = await getSessionUser();
  if (!isStaff(user)) {
    redirect('/dashboard');
  }

  const { liveClassId } = await params;

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: { program: true, group: true },
  });
  if (!liveClass) {
    notFound();
  }

  const [openSession, roster] = await Promise.all([
    prisma.attendanceSession.findFirst({
      where: { liveClassId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, expiresAt: true },
    }),
    getAttendanceRoster(liveClassId),
  ]);

  // A row can still be OPEN in the DB past its expiry (lazy flip happens on the
  // check-in path). Present it as not-open here.
  const liveOpenSession =
    openSession && openSession.expiresAt > new Date()
      ? { id: openSession.id, expiresAt: openSession.expiresAt.toISOString() }
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/attendance/manage"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        All classes
      </Link>

      <AttendanceManageClient
        liveClass={{
          id: liveClass.id,
          title: liveClass.title,
          instructorName: liveClass.instructorName,
          startsAt: liveClass.startsAt.toISOString(),
          endsAt: liveClass.endsAt.toISOString(),
          status: liveClass.status,
          programName: liveClass.program.name,
          groupName: liveClass.group?.name ?? null,
        }}
        openSession={liveOpenSession}
        initialRoster={roster.map((r) => ({
          ...r,
          checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
