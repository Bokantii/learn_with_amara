import { describe, it, expect, vi, beforeEach } from 'vitest';

const enrollmentFindMany = vi.fn();
const membershipFindMany = vi.fn();
const announcementFindMany = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    enrollment: { findMany: (...a: unknown[]) => enrollmentFindMany(...a) },
    groupMembership: { findMany: (...a: unknown[]) => membershipFindMany(...a) },
    announcement: { findMany: (...a: unknown[]) => announcementFindMany(...a) },
  },
}));

import { listStudentAnnouncements, getRecentStudentAnnouncements } from './queries';
import { NOTIFY_ENROLLMENT_STATUSES } from '../enrollment/status';

beforeEach(() => {
  vi.clearAllMocks();
  announcementFindMany.mockResolvedValue([]);
});

/** The `where` the feed query was called with. */
async function whereFor(opts: {
  programIds?: string[];
  groupIds?: string[];
}) {
  enrollmentFindMany.mockResolvedValue((opts.programIds ?? []).map((programId) => ({ programId })));
  membershipFindMany.mockResolvedValue((opts.groupIds ?? []).map((groupId) => ({ groupId })));
  await listStudentAnnouncements('me');
  return announcementFindMany.mock.calls[0][0].where;
}

describe('targetedAnnouncementWhere (via listStudentAnnouncements)', () => {
  it('always restricts to published, non-archived announcements', async () => {
    const where = await whereFor({ programIds: ['p1'] });
    expect(where.publishedAt).toEqual({ not: null });
    expect(where.archivedAt).toBeNull();
  });

  it('reads only the viewer’s own STUDENT / NOTIFY enrollments and memberships', async () => {
    await whereFor({ programIds: ['p1'] });
    expect(enrollmentFindMany.mock.calls[0][0].where).toEqual({
      userId: 'me',
      status: { in: NOTIFY_ENROLLMENT_STATUSES },
      user: { role: 'STUDENT' },
    });
    expect(membershipFindMany.mock.calls[0][0].where).toEqual({ userId: 'me' });
  });

  it('a NOTIFY-enrolled student gets ALL + their programs + entitled groups + their own', async () => {
    const where = await whereFor({ programIds: ['p1', 'p2'], groupIds: ['g1'] });
    expect(where.OR).toEqual([
      { scope: 'STUDENT', studentId: 'me' },
      { scope: 'ALL' },
      { scope: 'PROGRAM', programId: { in: ['p1', 'p2'] } },
      { scope: 'GROUP', groupId: { in: ['g1'] }, group: { programId: { in: ['p1', 'p2'] } } },
    ]);
  });

  it('a student with NO NOTIFY enrollment only ever sees STUDENT-scoped announcements addressed to them', async () => {
    const where = await whereFor({ programIds: [], groupIds: ['g1'] });
    expect(where.OR).toEqual([{ scope: 'STUDENT', studentId: 'me' }]);
  });

  it('a group member with no entitlement in that group’s program gets no GROUP clause', async () => {
    // enrolled in p1 (NOTIFY) but the group belongs to a different program — the
    // GROUP clause still requires group.programId ∈ my programIds, so a stale
    // membership can’t leak the announcement.
    const where = await whereFor({ programIds: ['p1'], groupIds: ['g-other'] });
    const groupClause = (where.OR as { scope: string }[]).find((c) => c.scope === 'GROUP');
    expect(groupClause).toMatchObject({ group: { programId: { in: ['p1'] } } });
  });

  it('getRecentStudentAnnouncements passes a take limit', async () => {
    enrollmentFindMany.mockResolvedValue([{ programId: 'p1' }]);
    membershipFindMany.mockResolvedValue([]);
    await getRecentStudentAnnouncements('me', 3);
    expect(announcementFindMany.mock.calls[0][0].take).toBe(3);
  });
});
