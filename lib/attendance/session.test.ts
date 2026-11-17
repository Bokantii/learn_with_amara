import { describe, it, expect, vi, beforeEach } from 'vitest';

const sessionUpdateMany = vi.fn();
const sessionCreate = vi.fn();
const sessionFindUniqueOrThrow = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    attendanceSession: {
      updateMany: (...a: unknown[]) => sessionUpdateMany(...a),
      create: (...a: unknown[]) => sessionCreate(...a),
      findUniqueOrThrow: (...a: unknown[]) => sessionFindUniqueOrThrow(...a),
    },
  },
}));

import {
  startAttendanceSession,
  closeAttendanceSession,
  getAttendanceSessionStatus,
} from './session';
import { hashAttendanceToken } from './token';
import { ATTENDANCE_SESSION_DURATION_MINUTES } from './constants';

const LIVE_CLASS_ID = 'lc_1';
const CREATED_BY = 'u_admin';
const SESSION_ID = 'sess_1';

beforeEach(() => {
  vi.clearAllMocks();
  sessionUpdateMany.mockResolvedValue({ count: 0 });
  sessionCreate.mockResolvedValue({ id: SESSION_ID });
});

describe('startAttendanceSession', () => {
  it('auto-closes any existing OPEN session for the class before creating a new one', async () => {
    await startAttendanceSession(LIVE_CLASS_ID, CREATED_BY);

    expect(sessionUpdateMany).toHaveBeenCalledWith({
      where: { liveClassId: LIVE_CLASS_ID, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: expect.any(Date) },
    });
    // close-then-create ordering
    expect(sessionUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(
      sessionCreate.mock.invocationCallOrder[0]
    );
  });

  it('persists only the token hash and an expiry ~15 min out, and returns the raw token once', async () => {
    const before = Date.now();
    const result = await startAttendanceSession(LIVE_CLASS_ID, CREATED_BY);
    const after = Date.now();

    const createArg = sessionCreate.mock.calls[0][0] as {
      data: { liveClassId: string; createdBy: string; tokenHash: string; expiresAt: Date };
    };
    expect(createArg.data.liveClassId).toBe(LIVE_CLASS_ID);
    expect(createArg.data.createdBy).toBe(CREATED_BY);
    // hash stored, raw token not
    expect(createArg.data).not.toHaveProperty('rawToken');
    expect(createArg.data.tokenHash).toBe(hashAttendanceToken(result.rawToken));
    expect(createArg.data.tokenHash).not.toBe(result.rawToken);

    const expiryMs = createArg.data.expiresAt.getTime();
    expect(expiryMs).toBeGreaterThanOrEqual(before + ATTENDANCE_SESSION_DURATION_MINUTES * 60_000);
    expect(expiryMs).toBeLessThanOrEqual(after + ATTENDANCE_SESSION_DURATION_MINUTES * 60_000);

    expect(result.sessionId).toBe(SESSION_ID);
    expect(result.expiresAt.getTime()).toBe(expiryMs);
  });
});

describe('closeAttendanceSession', () => {
  it('only transitions an OPEN session (idempotent for already-closed/expired)', async () => {
    await closeAttendanceSession(SESSION_ID);

    expect(sessionUpdateMany).toHaveBeenCalledWith({
      where: { id: SESSION_ID, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: expect.any(Date) },
    });
  });
});

describe('getAttendanceSessionStatus', () => {
  it('projects status, expiry, checked-in count and the recent list', async () => {
    const checkedInAt = new Date('2026-09-05T16:01:00.000Z');
    sessionFindUniqueOrThrow.mockResolvedValue({
      status: 'OPEN',
      expiresAt: new Date('2026-09-05T16:15:00.000Z'),
      records: [
        { studentUserId: 'u1', status: 'PRESENT', checkedInAt, student: { name: 'Aisha Bello' } },
      ],
      _count: { records: 3 },
    });

    const result = await getAttendanceSessionStatus(SESSION_ID);

    expect(result).toEqual({
      status: 'OPEN',
      expiresAt: new Date('2026-09-05T16:15:00.000Z'),
      checkedInCount: 3,
      recent: [
        { studentUserId: 'u1', studentName: 'Aisha Bello', status: 'PRESENT', checkedInAt },
      ],
    });
  });
});
