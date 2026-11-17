import { prisma } from '../../../lib/prisma';
import LiveClassesClient from './LiveClassesClient';

// One line per (class, notification type): counts of email deliveries so the
// admin can see reminder/cancellation/reschedule communication status
// without a separate notifications-history page (kept intentionally simple).
function summarizeNotifications(
  rows: { relatedEntityId: string; type: string; status: string }[]
) {
  const byClass = new Map<
    string,
    Record<string, { sent: number; failed: number; skipped: number; total: number }>
  >();
  for (const row of rows) {
    const forClass = byClass.get(row.relatedEntityId) ?? {};
    const forType = forClass[row.type] ?? { sent: 0, failed: 0, skipped: 0, total: 0 };
    forType.total += 1;
    if (row.status === 'SENT') forType.sent += 1;
    if (row.status === 'FAILED') forType.failed += 1;
    if (row.status === 'SKIPPED') forType.skipped += 1;
    forClass[row.type] = forType;
    byClass.set(row.relatedEntityId, forClass);
  }
  return byClass;
}

export default async function AdminLiveClassesPage() {
  const [liveClasses, programs, groups] = await Promise.all([
    prisma.liveClass.findMany({
      include: { program: true, group: true },
      orderBy: { startsAt: 'desc' },
    }),
    prisma.program.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.group.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Scoped to the classes actually on the page — the notifications table grows
  // far faster than live_classes, so this must never be an unbounded scan.
  const notificationRows = await prisma.notification.findMany({
    where: {
      relatedEntityType: 'LiveClass',
      relatedEntityId: { in: liveClasses.map((lc) => lc.id) },
      channel: 'EMAIL',
    },
    select: { relatedEntityId: true, type: true, status: true },
  });

  const notificationsByClass = summarizeNotifications(notificationRows);

  const rows = liveClasses.map((lc) => ({
    id: lc.id,
    programId: lc.programId,
    programName: lc.program.name,
    groupId: lc.groupId,
    groupName: lc.group?.name ?? null,
    title: lc.title,
    description: lc.description,
    instructorName: lc.instructorName,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    meetingUrl: lc.meetingUrl,
    status: lc.status,
    cancellationReason: lc.cancellationReason,
    cancellationMessage: lc.cancellationMessage,
    rescheduledAt: lc.rescheduledAt ? lc.rescheduledAt.toISOString() : null,
    notifications: notificationsByClass.get(lc.id) ?? null,
  }));

  const programOptions = programs.map((p) => ({ id: p.id, name: p.name }));
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name, programId: g.programId }));

  return (
    <LiveClassesClient
      initialLiveClasses={rows}
      programs={programOptions}
      groups={groupOptions}
    />
  );
}
