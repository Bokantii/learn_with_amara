import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { getSessionUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { VISIBLE_ENROLLMENT_STATUSES } from '@/lib/live-class-entitlement';
import { Card } from '@/components/ui/card';
import {
  AttendanceStatusBadge, type AttendanceStatusValue,
} from '@/components/AttendanceStatusBadge';

export const dynamic = 'force-dynamic';

/**
 * The student's own attendance history. Scoped strictly to the signed-in user
 * (`studentUserId: user.id`) — no other student's data is queryable here.
 * ABSENT is computed at read time (a past entitled class with no record), never
 * stored — matching the admin roster.
 */
export default async function StudentAttendancePage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect('/SignIn');
  }

  const [enrollments, memberships] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id, status: { in: VISIBLE_ENROLLMENT_STATUSES } },
      select: { programId: true },
    }),
    prisma.groupMembership.findMany({ where: { userId: user.id }, select: { groupId: true } }),
  ]);
  const programIds = enrollments.map((e) => e.programId);
  const memberGroupIds = memberships.map((m) => m.groupId);

  const now = new Date();

  const [classes, records] = await Promise.all([
    prisma.liveClass.findMany({
      where: {
        programId: { in: programIds },
        status: { in: ['SCHEDULED', 'COMPLETED'] },
        OR: [{ groupId: null }, { groupId: { in: memberGroupIds } }],
      },
      select: {
        id: true, title: true, instructorName: true, startsAt: true, endsAt: true,
        program: { select: { name: true } },
        group: { select: { name: true } },
      },
      orderBy: { startsAt: 'desc' },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentUserId: user.id },
      select: { liveClassId: true, status: true, checkedInAt: true },
    }),
  ]);

  const recordByClassId = new Map(records.map((r) => [r.liveClassId, r]));

  const rows = classes
    .map((c) => {
      const record = recordByClassId.get(c.id);
      const isPast = c.endsAt < now;
      if (!record && !isPast) return null; // upcoming, nothing to show yet
      const status: AttendanceStatusValue = record ? (record.status as AttendanceStatusValue) : 'ABSENT';
      return {
        id: c.id,
        title: c.title,
        instructorName: c.instructorName,
        startsAt: c.startsAt,
        programName: c.program.name,
        groupName: c.group?.name ?? null,
        status,
        checkedInAt: record?.checkedInAt ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const tally = rows.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {} as Record<AttendanceStatusValue, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Your check-in record for past live classes.</p>
      </div>

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          You have no attendance records yet. Scan the QR your instructor shows in class to check in.
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatusValue[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <AttendanceStatusBadge status={s} />
                <span className="text-slate-600">{tally[s] ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
                      {r.startsAt.toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                      <span className="text-slate-400">
                        · {r.programName}
                        {r.groupName ? ` · ${r.groupName}` : ''} · {r.instructorName}
                      </span>
                    </p>
                  </div>
                  <AttendanceStatusBadge status={r.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
