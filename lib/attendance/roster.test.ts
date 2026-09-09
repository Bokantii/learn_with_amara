import { describe, it, expect, vi, beforeEach } from 'vitest';

const liveClassFindUniqueOrThrow = vi.fn();
const recordFindMany = vi.fn();
const userFindMany = vi.fn();
const recordUpsert = vi.fn();
const entitledUserIdsForLiveClass = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    liveClass: { findUniqueOrThrow: (...a: unknown[]) => liveClassFindUniqueOrThrow(...a) },
    attendanceRecord: {
      findMany: (...a: unknown[]) => recordFindMany(...a),
      upsert: (...a: unknown[]) => recordUpsert(...a),
    },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

vi.mock('../live-class-entitlement', () => ({
  entitledUserIdsForLiveClass: (...a: unknown[]) => entitledUserIdsForLiveClass(...a),
  VISIBLE_ENROLLMENT_STATUSES: ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED'],
}));

import { getAttendanceRoster, setAttendanceOverride } from './roster';
import { VISIBLE_ENROLLMENT_STATUSES } from '../live-class-entitlement';

const LIVE_CLASS_ID = 'lc_1';

beforeEach(() => {
  vi.clearAllMocks();
  liveClassFindUniqueOrThrow.mockResolvedValue({ programId: 'p_1', groupId: null });
});

describe('getAttendanceRoster', () => {
  it('resolves entitlement against VISIBLE statuses and returns [] when nobody is entitled or recorded', async () => {
    entitledUserIdsForLiveClass.mockResolvedValue([]);
    recordFindMany.mockResolvedValue([]);

    const rows = await getAttendanceRoster(LIVE_CLASS_ID);

    expect(rows).toEqual([]);
    expect(entitledUserIdsForLiveClass).toHaveBeenCalledWith(
      { programId: 'p_1', groupId: null },
      VISIBLE_ENROLLMENT_STATUSES
    );
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it('marks entitled students with no record as computed ABSENT and keeps recorded statuses', async () => {
    entitledUserIdsForLiveClass.mockResolvedValue(['u1', 'u2', 'u3']);
    recordFindMany.mockResolvedValue([
      { studentUserId: 'u1', status: 'PRESENT', checkedInAt: new Date('2026-09-05T16:00:00Z'), source: 'QR_WEB' },
      { studentUserId: 'u3', status: 'EXCUSED', checkedInAt: null, source: 'ADMIN_OVERRIDE' },
    ]);
    userFindMany.mockResolvedValue([
      { id: 'u1', name: 'Aisha', email: 'aisha@example.com' },
      { id: 'u2', name: 'Noah', email: 'noah@example.com' },
      { id: 'u3', name: 'Lucas', email: 'lucas@example.com' },
    ]);

    const rows = await getAttendanceRoster(LIVE_CLASS_ID);

    expect(rows).toEqual([
      { studentUserId: 'u1', name: 'Aisha', email: 'aisha@example.com', status: 'PRESENT', checkedInAt: new Date('2026-09-05T16:00:00Z'), source: 'QR_WEB', hasRecord: true },
      { studentUserId: 'u2', name: 'Noah', email: 'noah@example.com', status: 'ABSENT', checkedInAt: null, source: null, hasRecord: false },
      { studentUserId: 'u3', name: 'Lucas', email: 'lucas@example.com', status: 'EXCUSED', checkedInAt: null, source: 'ADMIN_OVERRIDE', hasRecord: true },
    ]);
    // ABSENT is never queried for — all records for the class are fetched and diffed in memory.
    expect(recordFindMany).toHaveBeenCalledWith({
      where: { liveClassId: LIVE_CLASS_ID },
      select: { studentUserId: true, status: true, checkedInAt: true, source: true },
    });
  });

  it('still lists a student who has a record but is no longer entitled (history is preserved)', async () => {
    entitledUserIdsForLiveClass.mockResolvedValue(['u1']);
    recordFindMany.mockResolvedValue([
      { studentUserId: 'u2', status: 'PRESENT', checkedInAt: new Date('2026-09-05T16:00:00Z'), source: 'QR_WEB' },
    ]);
    userFindMany.mockResolvedValue([
      { id: 'u1', name: 'Aisha', email: 'aisha@example.com' },
      { id: 'u2', name: 'Dropped Student', email: 'dropped@example.com' },
    ]);

    const rows = await getAttendanceRoster(LIVE_CLASS_ID);
    const dropped = rows.find((r) => r.studentUserId === 'u2');

    expect(userFindMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
      select: { id: true, name: true, email: true },
    });
    expect(dropped).toMatchObject({ status: 'PRESENT', hasRecord: true });
  });
});

describe('setAttendanceOverride', () => {
  it('upserts a record keyed per-class-per-student, tagged ADMIN_OVERRIDE', async () => {
    recordUpsert.mockResolvedValue({});

    await setAttendanceOverride({
      liveClassId: LIVE_CLASS_ID,
      studentUserId: 'u2',
      status: 'EXCUSED',
      overriddenByUserId: 'u_admin',
      note: 'Cleared with instructor',
    });

    expect(recordUpsert).toHaveBeenCalledWith({
      where: { liveClassId_studentUserId: { liveClassId: LIVE_CLASS_ID, studentUserId: 'u2' } },
      create: {
        liveClassId: LIVE_CLASS_ID,
        studentUserId: 'u2',
        status: 'EXCUSED',
        source: 'ADMIN_OVERRIDE',
        checkedInAt: null,
        overriddenBy: 'u_admin',
        overrideNote: 'Cleared with instructor',
      },
      update: {
        status: 'EXCUSED',
        source: 'ADMIN_OVERRIDE',
        overriddenBy: 'u_admin',
        overrideNote: 'Cleared with instructor',
      },
    });
  });

  it('normalises a missing note to null', async () => {
    recordUpsert.mockResolvedValue({});

    await setAttendanceOverride({
      liveClassId: LIVE_CLASS_ID,
      studentUserId: 'u2',
      status: 'PRESENT',
      overriddenByUserId: 'u_admin',
    });

    const arg = recordUpsert.mock.calls[0][0] as { create: { overrideNote: unknown }; update: { overrideNote: unknown } };
    expect(arg.create.overrideNote).toBeNull();
    expect(arg.update.overrideNote).toBeNull();
  });
});
