import { describe, it, expect, vi, beforeEach } from 'vitest';

const sessionFindUnique = vi.fn();
const sessionUpdate = vi.fn();
const liveClassFindUnique = vi.fn();
const recordCreate = vi.fn();
const recordFindUnique = vi.fn();
const checkAttendanceCheckInRateLimit = vi.fn();
const isUserEntitledToLiveClass = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    attendanceSession: {
      findUnique: (...a: unknown[]) => sessionFindUnique(...a),
      update: (...a: unknown[]) => sessionUpdate(...a),
    },
    liveClass: {
      findUnique: (...a: unknown[]) => liveClassFindUnique(...a),
    },
    attendanceRecord: {
      create: (...a: unknown[]) => recordCreate(...a),
      findUnique: (...a: unknown[]) => recordFindUnique(...a),
    },
  },
}));

vi.mock('../rate-limit', () => ({
  checkAttendanceCheckInRateLimit: (...a: unknown[]) => checkAttendanceCheckInRateLimit(...a),
}));

vi.mock('../live-class-entitlement', () => ({
  isUserEntitledToLiveClass: (...a: unknown[]) => isUserEntitledToLiveClass(...a),
}));

import { checkInToAttendanceSession, getCheckInPreview } from './checkin';
import { hashAttendanceToken } from './token';

class PrismaKnownError extends Error {
  code = 'P2002';
}

const RAW_TOKEN = 'raw-token-abc';
const TOKEN_HASH = hashAttendanceToken(RAW_TOKEN);
const STUDENT_ID = 'u_student';
const LIVE_CLASS_ID = 'lc_1';
const SESSION_ID = 'sess_1';

function baseSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    liveClassId: LIVE_CLASS_ID,
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 10 * 60_000),
    ...overrides,
  };
}

function baseLiveClass(overrides: Record<string, unknown> = {}) {
  return {
    id: LIVE_CLASS_ID,
    programId: 'p_1',
    groupId: null,
    status: 'SCHEDULED',
    startsAt: new Date(Date.now() - 2 * 60_000),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  checkAttendanceCheckInRateLimit.mockResolvedValue({ success: true, remaining: 9, reset: 0 });
  isUserEntitledToLiveClass.mockResolvedValue(true);
});

describe('checkInToAttendanceSession', () => {
  it('happy path: entitled student checking in on time gets PRESENT', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue(baseLiveClass());
    recordCreate.mockResolvedValue({});

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('PRESENT');
      expect(result.checkedInAt).toBeInstanceOf(Date);
    }
    expect(sessionFindUnique).toHaveBeenCalledWith({ where: { tokenHash: TOKEN_HASH } });
    expect(recordCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        liveClassId: LIVE_CLASS_ID,
        sessionId: SESSION_ID,
        studentUserId: STUDENT_ID,
        status: 'PRESENT',
        source: 'QR_WEB',
      }),
    });
  });

  it('happy path: checking in after the late threshold gets LATE', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue(
      baseLiveClass({ startsAt: new Date(Date.now() - 60 * 60_000) })
    );
    recordCreate.mockResolvedValue({});

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe('LATE');
  });

  it('unknown token: session not found returns INVALID_OR_EXPIRED', async () => {
    sessionFindUnique.mockResolvedValue(null);

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'INVALID_OR_EXPIRED' });
    expect(liveClassFindUnique).not.toHaveBeenCalled();
  });

  it('closed session returns INVALID_OR_EXPIRED (same generic reason, no lazy update)', async () => {
    sessionFindUnique.mockResolvedValue(baseSession({ status: 'CLOSED' }));

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'INVALID_OR_EXPIRED' });
    expect(sessionUpdate).not.toHaveBeenCalled();
  });

  it('expired-but-still-OPEN-in-DB session lazily flips to EXPIRED and rejects', async () => {
    sessionFindUnique.mockResolvedValue(
      baseSession({ status: 'OPEN', expiresAt: new Date(Date.now() - 60_000) })
    );
    sessionUpdate.mockResolvedValue({});

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'INVALID_OR_EXPIRED' });
    expect(sessionUpdate).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { status: 'EXPIRED' },
    });
  });

  it('cancelled/completed class returns CLASS_NOT_ELIGIBLE', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue(baseLiveClass({ status: 'CANCELLED' }));

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'CLASS_NOT_ELIGIBLE' });
    expect(isUserEntitledToLiveClass).not.toHaveBeenCalled();
  });

  it('not-entitled student returns NOT_ENTITLED', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue(baseLiveClass());
    isUserEntitledToLiveClass.mockResolvedValue(false);

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'NOT_ENTITLED' });
    expect(recordCreate).not.toHaveBeenCalled();
  });

  it('duplicate check-in (simulated P2002) returns ALREADY_CHECKED_IN with the existing status', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue(baseLiveClass());
    recordCreate.mockRejectedValue(new PrismaKnownError('unique constraint'));
    recordFindUnique.mockResolvedValue({ status: 'LATE' });

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'ALREADY_CHECKED_IN', existingStatus: 'LATE' });
    expect(recordFindUnique).toHaveBeenCalledWith({
      where: { liveClassId_studentUserId: { liveClassId: LIVE_CLASS_ID, studentUserId: STUDENT_ID } },
    });
  });

  it('rate-limited: returns RATE_LIMITED and makes zero Prisma calls', async () => {
    checkAttendanceCheckInRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 0 });

    const result = await checkInToAttendanceSession({
      rawToken: RAW_TOKEN,
      studentUserId: STUDENT_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'RATE_LIMITED' });
    expect(sessionFindUnique).not.toHaveBeenCalled();
    expect(sessionUpdate).not.toHaveBeenCalled();
    expect(liveClassFindUnique).not.toHaveBeenCalled();
    expect(recordCreate).not.toHaveBeenCalled();
    expect(recordFindUnique).not.toHaveBeenCalled();
  });
});

describe('getCheckInPreview', () => {
  it('returns the class details for a valid OPEN session', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue({
      id: LIVE_CLASS_ID,
      title: 'TCF Speaking Practice',
      instructorName: 'Amarachi Nwankpa',
      startsAt: new Date('2026-09-05T16:00:00.000Z'),
      status: 'SCHEDULED',
    });

    const result = await getCheckInPreview(RAW_TOKEN);

    expect(result).toEqual({
      ok: true,
      liveClassId: LIVE_CLASS_ID,
      title: 'TCF Speaking Practice',
      instructorName: 'Amarachi Nwankpa',
      startsAt: new Date('2026-09-05T16:00:00.000Z'),
      classStatus: 'SCHEDULED',
    });
    expect(sessionFindUnique).toHaveBeenCalledWith({ where: { tokenHash: TOKEN_HASH } });
  });

  it('surfaces a cancelled class status rather than hiding it', async () => {
    sessionFindUnique.mockResolvedValue(baseSession());
    liveClassFindUnique.mockResolvedValue({
      id: LIVE_CLASS_ID,
      title: 'TCF Speaking Practice',
      instructorName: 'Amarachi Nwankpa',
      startsAt: new Date('2026-09-05T16:00:00.000Z'),
      status: 'CANCELLED',
    });

    const result = await getCheckInPreview(RAW_TOKEN);

    expect(result).toEqual(expect.objectContaining({ ok: true, classStatus: 'CANCELLED' }));
  });

  it('returns { ok: false } for an unknown token', async () => {
    sessionFindUnique.mockResolvedValue(null);

    expect(await getCheckInPreview(RAW_TOKEN)).toEqual({ ok: false });
    expect(liveClassFindUnique).not.toHaveBeenCalled();
  });

  it('returns { ok: false } for a closed session (same generic result)', async () => {
    sessionFindUnique.mockResolvedValue(baseSession({ status: 'CLOSED' }));

    expect(await getCheckInPreview(RAW_TOKEN)).toEqual({ ok: false });
  });

  it('returns { ok: false } for an expired session', async () => {
    sessionFindUnique.mockResolvedValue(
      baseSession({ status: 'OPEN', expiresAt: new Date(Date.now() - 60_000) })
    );

    expect(await getCheckInPreview(RAW_TOKEN)).toEqual({ ok: false });
  });

  it('does not write or lazily flip session status', async () => {
    sessionFindUnique.mockResolvedValue(
      baseSession({ status: 'OPEN', expiresAt: new Date(Date.now() - 60_000) })
    );

    await getCheckInPreview(RAW_TOKEN);

    expect(sessionUpdate).not.toHaveBeenCalled();
    expect(recordCreate).not.toHaveBeenCalled();
  });
});
