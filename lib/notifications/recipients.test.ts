import { describe, it, expect, vi, beforeEach } from 'vitest';

const enrollmentFindMany = vi.fn();
const groupMembershipFindMany = vi.fn();
const userFindMany = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    enrollment: { findMany: (...a: unknown[]) => enrollmentFindMany(...a) },
    groupMembership: { findMany: (...a: unknown[]) => groupMembershipFindMany(...a) },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

import { resolveLiveClassRecipients } from './recipients';
import { NOTIFY_ENROLLMENT_STATUSES } from '../live-class-entitlement';

const USERS = [
  { id: 'u_aisha', name: 'Aisha', email: 'aisha@example.com' },
  { id: 'u_lucas', name: 'Lucas', email: 'lucas@example.com' },
  { id: 'u_noah', name: 'Noah', email: 'noah@example.com' },
];

beforeEach(() => {
  vi.clearAllMocks();
  userFindMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) =>
    USERS.filter((u) => where.id.in.includes(u.id))
  );
});

describe('resolveLiveClassRecipients', () => {
  it('program-scoped class: every enrollee with a NOTIFY status is a recipient', async () => {
    enrollmentFindMany.mockResolvedValue([
      { userId: 'u_aisha' },
      { userId: 'u_lucas' },
      { userId: 'u_noah' },
    ]);

    const recipients = await resolveLiveClassRecipients({ programId: 'p_tcf', groupId: null });

    expect(recipients.map((r) => r.id).sort()).toEqual(['u_aisha', 'u_lucas', 'u_noah']);
    expect(groupMembershipFindMany).not.toHaveBeenCalled();
  });

  it('only ACTIVE/COMPLETED enrollments are queried — PENDING/PAUSED/CANCELLED never receive push notifications', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'u_aisha' }]);

    await resolveLiveClassRecipients({ programId: 'p_tcf', groupId: null });

    expect(enrollmentFindMany.mock.calls[0][0].where.status).toEqual({
      in: NOTIFY_ENROLLMENT_STATUSES,
    });
    expect(NOTIFY_ENROLLMENT_STATUSES).toEqual(['ACTIVE', 'COMPLETED']);
  });

  it('group-scoped class: only enrollees who are current group members', async () => {
    enrollmentFindMany.mockResolvedValue([
      { userId: 'u_aisha' },
      { userId: 'u_lucas' },
      { userId: 'u_noah' }, // entitled to the program but NOT in the cohort
    ]);
    groupMembershipFindMany.mockResolvedValue([{ userId: 'u_aisha' }, { userId: 'u_lucas' }]);

    const recipients = await resolveLiveClassRecipients({ programId: 'p_tcf', groupId: 'g_morning' });

    expect(recipients.map((r) => r.id).sort()).toEqual(['u_aisha', 'u_lucas']);
    expect(groupMembershipFindMany.mock.calls[0][0].where.userId.in.sort()).toEqual([
      'u_aisha',
      'u_lucas',
      'u_noah',
    ]);
  });

  it('group membership without a qualifying enrollment is never sufficient', async () => {
    enrollmentFindMany.mockResolvedValue([]); // dropped / paused / pending — not in the NOTIFY set

    const recipients = await resolveLiveClassRecipients({ programId: 'p_tcf', groupId: 'g_morning' });

    expect(recipients).toEqual([]);
    expect(groupMembershipFindMany).not.toHaveBeenCalled();
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it('no entitled users: returns [] without hitting the user table', async () => {
    enrollmentFindMany.mockResolvedValue([]);

    const recipients = await resolveLiveClassRecipients({ programId: 'p_tcf', groupId: null });

    expect(recipients).toEqual([]);
    expect(userFindMany).not.toHaveBeenCalled();
  });
});
