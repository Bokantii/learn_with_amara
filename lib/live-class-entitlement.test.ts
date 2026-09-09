import { describe, it, expect, vi, beforeEach } from 'vitest';

const enrollmentFindMany = vi.fn();
const groupMembershipFindMany = vi.fn();

vi.mock('./prisma', () => ({
  prisma: {
    enrollment: { findMany: (...a: unknown[]) => enrollmentFindMany(...a) },
    groupMembership: { findMany: (...a: unknown[]) => groupMembershipFindMany(...a) },
  },
}));

import {
  isUserEntitledToLiveClass,
  VISIBLE_ENROLLMENT_STATUSES,
  NOTIFY_ENROLLMENT_STATUSES,
} from './live-class-entitlement';

beforeEach(() => {
  vi.clearAllMocks();
  groupMembershipFindMany.mockResolvedValue([]);
});

describe('isUserEntitledToLiveClass', () => {
  it('defaults to VISIBLE_ENROLLMENT_STATUSES, not NOTIFY_ENROLLMENT_STATUSES', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'u1' }]);

    await isUserEntitledToLiveClass('u1', { programId: 'p1', groupId: null });

    expect(enrollmentFindMany).toHaveBeenCalledWith({
      where: { programId: 'p1', status: { in: VISIBLE_ENROLLMENT_STATUSES } },
      select: { userId: true },
    });
    expect(VISIBLE_ENROLLMENT_STATUSES).not.toEqual(NOTIFY_ENROLLMENT_STATUSES);
  });

  it('returns true when the user id is in the resolved entitled set', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);

    const entitled = await isUserEntitledToLiveClass('u1', { programId: 'p1', groupId: null });

    expect(entitled).toBe(true);
  });

  it('returns false when the user id is not in the resolved entitled set', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'u2' }]);

    const entitled = await isUserEntitledToLiveClass('u1', { programId: 'p1', groupId: null });

    expect(entitled).toBe(false);
  });

  it('respects an explicit statuses override', async () => {
    enrollmentFindMany.mockResolvedValue([{ userId: 'u1' }]);

    await isUserEntitledToLiveClass('u1', { programId: 'p1', groupId: null }, NOTIFY_ENROLLMENT_STATUSES);

    expect(enrollmentFindMany).toHaveBeenCalledWith({
      where: { programId: 'p1', status: { in: NOTIFY_ENROLLMENT_STATUSES } },
      select: { userId: true },
    });
  });

  describe('group-scoped class', () => {
    it('intersects the enrolled set with current group members (program-enrolled non-member is NOT entitled)', async () => {
      // u1 and u2 are both enrolled in the program; only u1 is a current member of the group.
      enrollmentFindMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
      groupMembershipFindMany.mockResolvedValue([{ userId: 'u1' }]);

      expect(await isUserEntitledToLiveClass('u1', { programId: 'p1', groupId: 'g1' })).toBe(true);
      expect(await isUserEntitledToLiveClass('u2', { programId: 'p1', groupId: 'g1' })).toBe(false);

      expect(groupMembershipFindMany).toHaveBeenCalledWith({
        where: { groupId: 'g1', userId: { in: ['u1', 'u2'] } },
        select: { userId: true },
      });
    });

    it('a current group member with no qualifying enrollment is NOT entitled (stale membership is insufficient)', async () => {
      enrollmentFindMany.mockResolvedValue([]);
      groupMembershipFindMany.mockResolvedValue([{ userId: 'u1' }]);

      expect(await isUserEntitledToLiveClass('u1', { programId: 'p1', groupId: 'g1' })).toBe(false);
      // short-circuits: no enrolled ids means the membership query is never needed
      expect(groupMembershipFindMany).not.toHaveBeenCalled();
    });
  });
});
