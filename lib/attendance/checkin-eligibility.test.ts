import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * QR self check-in eligibility (#25, V1 policy 2026-10-21): only a student with
 * an ACTIVE enrollment entitling them to the specific class may check in.
 *
 * Unlike checkin.test.ts, this runs the real `checkInToAttendanceSession` *and*
 * the real `lib/live-class-entitlement.ts` over a small in-memory Prisma fake,
 * so the status filter, program match and group scoping are exercised end to
 * end rather than mocked away. Only rate limiting is stubbed.
 */

type EnrollmentRow = { userId: string; programId: string; status: string; role: string };

const db = {
  enrollments: [] as EnrollmentRow[],
  memberships: [] as { groupId: string; userId: string }[],
  records: [] as Record<string, unknown>[],
  liveClass: {} as Record<string, unknown>,
  session: {} as Record<string, unknown>,
};

vi.mock('../prisma', () => ({
  prisma: {
    attendanceSession: {
      findUnique: async () => db.session,
      update: async () => ({}),
    },
    liveClass: {
      findUnique: async () => db.liveClass,
    },
    enrollment: {
      findMany: async ({
        where,
      }: {
        where: { programId: string; status: { in: string[] }; user: { role: string } };
      }) =>
        db.enrollments
          .filter(
            (e) =>
              e.programId === where.programId &&
              where.status.in.includes(e.status) &&
              e.role === where.user.role
          )
          .map((e) => ({ userId: e.userId })),
    },
    groupMembership: {
      findMany: async ({ where }: { where: { groupId: string; userId: { in: string[] } } }) =>
        db.memberships
          .filter((m) => m.groupId === where.groupId && where.userId.in.includes(m.userId))
          .map((m) => ({ userId: m.userId })),
    },
    attendanceRecord: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        db.records.push(data);
        return data;
      },
      findUnique: async () => null,
    },
  },
}));

vi.mock('../rate-limit', () => ({
  checkAttendanceCheckInRateLimit: async () => ({ success: true, remaining: 9, reset: 0 }),
}));

import { checkInToAttendanceSession, getCheckInPreview } from './checkin';

const STUDENT = 'u_student';
const RAW_TOKEN = 'raw-token';

function enroll(status: string, programId = 'p_tcf') {
  db.enrollments.push({ userId: STUDENT, programId, status, role: 'STUDENT' });
}

function checkIn() {
  return checkInToAttendanceSession({ rawToken: RAW_TOKEN, studentUserId: STUDENT });
}

beforeEach(() => {
  db.enrollments = [];
  db.memberships = [];
  db.records = [];
  db.session = {
    id: 'sess_1',
    liveClassId: 'lc_1',
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 10 * 60_000),
  };
  db.liveClass = {
    id: 'lc_1',
    title: 'TCF Live',
    instructorName: 'Instructor',
    programId: 'p_tcf',
    groupId: null,
    status: 'SCHEDULED',
    startsAt: new Date(Date.now() - 60_000),
  };
});

describe('QR check-in eligibility (ACTIVE enrollment only)', () => {
  it('ACTIVE enrollment in the class program checks in', async () => {
    enroll('ACTIVE');
    const result = await checkIn();
    expect(result).toMatchObject({ ok: true, status: 'PRESENT' });
    expect(db.records).toHaveLength(1);
  });

  it.each(['PENDING', 'PAUSED', 'CANCELLED', 'COMPLETED'])(
    '%s enrollment in the class program is rejected and nothing is recorded',
    async (status) => {
      enroll(status);
      expect(await checkIn()).toEqual({ ok: false, reason: 'NOT_ENTITLED' });
      expect(db.records).toHaveLength(0);
    }
  );

  it('no enrollment at all is rejected', async () => {
    expect(await checkIn()).toEqual({ ok: false, reason: 'NOT_ENTITLED' });
    expect(db.records).toHaveLength(0);
  });

  it('ACTIVE enrollment in a different program is rejected', async () => {
    enroll('ACTIVE', 'p_tef');
    expect(await checkIn()).toEqual({ ok: false, reason: 'NOT_ENTITLED' });
    expect(db.records).toHaveLength(0);
  });

  it('ACTIVE in the program but not a member of the class group is rejected', async () => {
    db.liveClass = { ...db.liveClass, groupId: 'g_morning' };
    enroll('ACTIVE');
    expect(await checkIn()).toEqual({ ok: false, reason: 'NOT_ENTITLED' });

    db.memberships.push({ groupId: 'g_morning', userId: STUDENT });
    expect(await checkIn()).toMatchObject({ ok: true });
  });

  it('an enrollment paused after the QR page loaded is rejected at submit time', async () => {
    enroll('ACTIVE');
    expect((await getCheckInPreview(RAW_TOKEN)).ok).toBe(true);

    db.enrollments[0].status = 'PAUSED';

    expect(await checkIn()).toEqual({ ok: false, reason: 'NOT_ENTITLED' });
    expect(db.records).toHaveLength(0);
  });
});
