import { describe, it, expect, vi, beforeEach } from 'vitest';

const enrollmentFindMany = vi.fn();
const groupMembershipFindMany = vi.fn();
const groupFindUnique = vi.fn();
const userFindUnique = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    enrollment: { findMany: (...a: unknown[]) => enrollmentFindMany(...a) },
    groupMembership: { findMany: (...a: unknown[]) => groupMembershipFindMany(...a) },
    group: { findUnique: (...a: unknown[]) => groupFindUnique(...a) },
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
  },
}));

import { resolveAnnouncementRecipientIds } from './targeting';
import { NOTIFY_ENROLLMENT_STATUSES } from '../enrollment/status';

beforeEach(() => vi.clearAllMocks());

describe('resolveAnnouncementRecipientIds', () => {
  const base = { programId: null, groupId: null, studentId: null };

  it('ALL → distinct NOTIFY-status STUDENT user ids', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'a' }, { userId: 'b' }]);
    const ids = await resolveAnnouncementRecipientIds({ ...base, scope: 'ALL' });
    expect(ids.sort()).toEqual(['a', 'b']);
    const where = enrollmentFindMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: NOTIFY_ENROLLMENT_STATUSES });
    expect(where.user).toEqual({ role: 'STUDENT' });
  });

  it('PROGRAM → NOTIFY student enrollees of that program', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'x' }]);
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'PROGRAM', programId: 'p' })).toEqual(['x']);
    const where = enrollmentFindMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ programId: 'p', status: { in: NOTIFY_ENROLLMENT_STATUSES }, user: { role: 'STUDENT' } });
  });

  it('PROGRAM with no programId → empty', async () => {
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'PROGRAM' })).toEqual([]);
    expect(enrollmentFindMany).not.toHaveBeenCalled();
  });

  it("GROUP → group members who hold a NOTIFY enrollment in the group's program", async () => {
    groupFindUnique.mockResolvedValue({ programId: 'p' });
    enrollmentFindMany.mockResolvedValue([{ userId: 'a' }, { userId: 'b' }]);
    groupMembershipFindMany.mockResolvedValue([{ userId: 'a' }]);
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'GROUP', groupId: 'g' })).toEqual(['a']);
  });

  it('GROUP with a missing group → empty', async () => {
    groupFindUnique.mockResolvedValue(null);
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'GROUP', groupId: 'g' })).toEqual([]);
  });

  it('GROUP where nobody is entitled → empty, without hitting membership', async () => {
    groupFindUnique.mockResolvedValue({ programId: 'p' });
    enrollmentFindMany.mockResolvedValue([]);
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'GROUP', groupId: 'g' })).toEqual([]);
    expect(groupMembershipFindMany).not.toHaveBeenCalled();
  });

  it('STUDENT → just that id, only when the user is a STUDENT', async () => {
    userFindUnique.mockResolvedValueOnce({ id: 's', role: 'STUDENT' });
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'STUDENT', studentId: 's' })).toEqual(['s']);

    userFindUnique.mockResolvedValueOnce({ id: 's', role: 'ADMIN' });
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'STUDENT', studentId: 's' })).toEqual([]);

    userFindUnique.mockResolvedValueOnce(null);
    expect(await resolveAnnouncementRecipientIds({ ...base, scope: 'STUDENT', studentId: 'missing' })).toEqual([]);
  });
});
