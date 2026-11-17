import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../prisma';
import { NOTIFY_ENROLLMENT_STATUSES } from '../enrollment/status';

/**
 * Reads for the announcement surfaces (SPEC §11.11). The student feed recomputes
 * targeting server-side from the viewer's current enrollments / group
 * memberships — a student can only ever see announcements addressed to them, and
 * there is no per-announcement student route.
 */

export interface StudentAnnouncement {
  id: string;
  title: string;
  body: string;
  publishedAt: Date;
  scopeLabel: string;
}

function scopeLabel(a: {
  scope: string;
  program: { name: string } | null;
  group: { name: string } | null;
}): string {
  switch (a.scope) {
    case 'ALL':
      return 'All students';
    case 'PROGRAM':
      return a.program?.name ?? 'Program';
    case 'GROUP':
      return a.group?.name ?? 'Group';
    default:
      return 'For you';
  }
}

async function targetedAnnouncementWhere(userId: string): Promise<Prisma.AnnouncementWhereInput> {
  const [enrollments, memberships] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, status: { in: NOTIFY_ENROLLMENT_STATUSES }, user: { role: 'STUDENT' } },
      select: { programId: true },
    }),
    prisma.groupMembership.findMany({ where: { userId }, select: { groupId: true } }),
  ]);
  const programIds = [...new Set(enrollments.map((e) => e.programId))];
  const groupIds = memberships.map((m) => m.groupId);

  const or: Prisma.AnnouncementWhereInput[] = [{ scope: 'STUDENT', studentId: userId }];
  if (programIds.length > 0) {
    or.push({ scope: 'ALL' });
    or.push({ scope: 'PROGRAM', programId: { in: programIds } });
    if (groupIds.length > 0) {
      or.push({
        scope: 'GROUP',
        groupId: { in: groupIds },
        group: { programId: { in: programIds } },
      });
    }
  }

  return { publishedAt: { not: null }, archivedAt: null, OR: or };
}

const STUDENT_SELECT = {
  id: true,
  title: true,
  body: true,
  publishedAt: true,
  scope: true,
  program: { select: { name: true } },
  group: { select: { name: true } },
} as const;

/** Announcements addressed to `userId` (published, not archived), newest first. */
export async function listStudentAnnouncements(
  userId: string,
  limit?: number
): Promise<StudentAnnouncement[]> {
  const rows = await prisma.announcement.findMany({
    where: await targetedAnnouncementWhere(userId),
    orderBy: { publishedAt: 'desc' },
    ...(limit ? { take: limit } : {}),
    select: STUDENT_SELECT,
  });
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    publishedAt: a.publishedAt as Date,
    scopeLabel: scopeLabel(a),
  }));
}

/** The most recent few, for the dashboard card. */
export function getRecentStudentAnnouncements(
  userId: string,
  limit = 3
): Promise<StudentAnnouncement[]> {
  return listStudentAnnouncements(userId, limit);
}

export type AdminAnnouncementState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AdminAnnouncementRow {
  id: string;
  title: string;
  body: string;
  scope: string;
  scopeLabel: string;
  programId: string | null;
  groupId: string | null;
  studentId: string | null;
  state: AdminAnnouncementState;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  createdByName: string;
  /**
   * `reached` — students who got the in-app notification (the authoritative
   * "sent to N"). `emailSkipped` / `emailFailed` — of those, how many did not
   * get the email (delivery not configured, or provider rejected/errored).
   */
  delivery: { reached: number; emailSkipped: number; emailFailed: number };
}

export async function listAdminAnnouncements(): Promise<AdminAnnouncementRow[]> {
  const [announcements, notifCounts] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        scope: true,
        programId: true,
        groupId: true,
        studentId: true,
        publishedAt: true,
        archivedAt: true,
        createdAt: true,
        program: { select: { name: true } },
        group: { select: { name: true } },
        student: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.notification.groupBy({
      by: ['relatedEntityId', 'channel', 'status'],
      where: { relatedEntityType: 'Announcement' },
      _count: { _all: true },
    }),
  ]);

  const tally = new Map<string, { reached: number; emailSkipped: number; emailFailed: number }>();
  for (const row of notifCounts) {
    const cur = tally.get(row.relatedEntityId) ?? { reached: 0, emailSkipped: 0, emailFailed: 0 };
    const n = row._count._all;
    if (row.channel === 'IN_APP' && row.status === 'SENT') cur.reached += n;
    if (row.channel === 'EMAIL' && row.status === 'SKIPPED') cur.emailSkipped += n;
    if (row.channel === 'EMAIL' && row.status === 'FAILED') cur.emailFailed += n;
    tally.set(row.relatedEntityId, cur);
  }

  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    scope: a.scope,
    scopeLabel:
      a.scope === 'STUDENT'
        ? (a.student?.name ?? 'A student')
        : scopeLabel({ scope: a.scope, program: a.program, group: a.group }),
    programId: a.programId,
    groupId: a.groupId,
    studentId: a.studentId,
    state: a.archivedAt ? 'ARCHIVED' : a.publishedAt ? 'PUBLISHED' : 'DRAFT',
    publishedAt: a.publishedAt,
    archivedAt: a.archivedAt,
    createdAt: a.createdAt,
    createdByName: a.createdBy?.name ?? 'A former admin',
    delivery: tally.get(a.id) ?? { reached: 0, emailSkipped: 0, emailFailed: 0 },
  }));
}
