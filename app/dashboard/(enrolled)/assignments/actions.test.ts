import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Authorization regression tests for `submitAssignmentAction` (SPEC Known
 * Deferred Issue #26). Runs the real action and the real `lib/authz`
 * (`getSessionUser` + `hasProgramAccess`) over an in-memory Prisma fake, so the
 * decision is made from the session identity and current database state —
 * never from anything the client puts in the FormData. Only NextAuth's
 * `auth()`, Vercel Blob `put` and `revalidatePath` are stubbed.
 *
 * Every rejection asserts that nothing was written: no Submission row and no
 * uploaded file (attachment reference).
 */

type Enrollment = { userId: string; programId: string; status: string };

const db = {
  users: new Map<string, { status: string }>(),
  assignments: new Map<string, { programId: string; groupId: string | null }>(),
  enrollments: [] as Enrollment[],
  memberships: [] as { userId: string; groupId: string }[],
  submissions: [] as { studentId: string; assignmentId: string; fileUrl: string }[],
};

const auth = vi.fn();
const put = vi.fn();

vi.mock('../../../../auth', () => ({ auth: () => auth() }));
vi.mock('@vercel/blob', () => ({ put: (...a: unknown[]) => put(...a) }));
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }));

vi.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const u = db.users.get(where.id);
        return u
          ? { role: 'STUDENT', status: u.status, name: 'Student', email: 's@example.com', passwordChangedAt: null }
          : null;
      },
    },
    assignment: {
      findUnique: async ({ where }: { where: { id: string } }) => db.assignments.get(where.id) ?? null,
    },
    enrollment: {
      count: async ({
        where,
      }: {
        where: { userId: string; programId: string; status: { in: string[] } };
      }) =>
        db.enrollments.filter(
          (e) =>
            e.userId === where.userId &&
            e.programId === where.programId &&
            where.status.in.includes(e.status)
        ).length,
    },
    groupMembership: {
      findFirst: async ({ where }: { where: { userId: string; groupId: string } }) =>
        db.memberships.find((m) => m.userId === where.userId && m.groupId === where.groupId) ?? null,
    },
    submission: {
      findFirst: async ({ where }: { where: { studentId: string; assignmentId: string } }) =>
        db.submissions.find(
          (s) => s.studentId === where.studentId && s.assignmentId === where.assignmentId
        ) ?? null,
      create: async ({ data }: { data: { studentId: string; assignmentId: string; fileUrl: string } }) => {
        db.submissions.push(data);
        return data;
      },
    },
  },
}));

import { submitAssignmentAction } from './actions';

const STUDENT = 'u_student';
const OTHER_STUDENT = 'u_other';
const ASSIGNMENT = 'a_tcf';
const NO_ACCESS = { error: 'You do not have access to this assignment.' };

function signedInAs(userId: string | null) {
  auth.mockResolvedValue(userId ? { user: { id: userId } } : null);
}

function enroll(status: string, programId = 'p_tcf', userId = STUDENT) {
  db.enrollments.push({ userId, programId, status });
}

function form(extra: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set('assignmentId', ASSIGNMENT);
  fd.set('file', new File(['essay'], 'essay.pdf', { type: 'application/pdf' }));
  for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  return fd;
}

function expectNothingWritten() {
  expect(db.submissions).toHaveLength(0);
  expect(put).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  put.mockResolvedValue({ url: 'https://blob.example/submissions/essay.pdf' });
  db.users = new Map([
    [STUDENT, { status: 'ACTIVE' }],
    [OTHER_STUDENT, { status: 'ACTIVE' }],
  ]);
  db.assignments = new Map([[ASSIGNMENT, { programId: 'p_tcf', groupId: null }]]);
  db.enrollments = [];
  db.memberships = [];
  db.submissions = [];
  signedInAs(STUDENT);
});

describe('submitAssignmentAction authorization', () => {
  it('positive control: an ACTIVE student in the assignment program submits', async () => {
    enroll('ACTIVE');
    expect(await submitAssignmentAction(form())).toEqual({ success: true });
    expect(put).toHaveBeenCalledTimes(1);
    expect(db.submissions).toEqual([
      { studentId: STUDENT, assignmentId: ASSIGNMENT, fileUrl: 'https://blob.example/submissions/essay.pdf' },
    ]);
  });

  it('rejects an unauthenticated request', async () => {
    signedInAs(null);
    expect(await submitAssignmentAction(form())).toEqual({
      error: 'You must be signed in to submit an assignment.',
    });
    expectNothingWritten();
  });

  it('rejects a session whose account is no longer ACTIVE (deactivated)', async () => {
    enroll('ACTIVE');
    db.users.set(STUDENT, { status: 'DEACTIVATED' });
    expect(await submitAssignmentAction(form())).toEqual({
      error: 'You must be signed in to submit an assignment.',
    });
    expectNothingWritten();
  });

  it('rejects a student with no enrollment', async () => {
    expect(await submitAssignmentAction(form())).toEqual(NO_ACCESS);
    expectNothingWritten();
  });

  it.each(['PENDING', 'PAUSED', 'CANCELLED'])(
    'rejects a %s enrollment in the assignment program',
    async (status) => {
      enroll(status);
      expect(await submitAssignmentAction(form())).toEqual(NO_ACCESS);
      expectNothingWritten();
    }
  );

  it('rejects an ACTIVE enrollment in a different program', async () => {
    enroll('ACTIVE', 'p_tef');
    expect(await submitAssignmentAction(form())).toEqual(NO_ACCESS);
    expectNothingWritten();
  });

  it('rejects ACTIVE elsewhere + CANCELLED in the assignment program (no any-active bypass)', async () => {
    enroll('ACTIVE', 'p_tef');
    enroll('CANCELLED', 'p_tcf');
    expect(await submitAssignmentAction(form())).toEqual(NO_ACCESS);
    expectNothingWritten();
  });

  it('rejects an ACTIVE program student who is not in the assignment group', async () => {
    db.assignments.set(ASSIGNMENT, { programId: 'p_tcf', groupId: 'g_morning' });
    enroll('ACTIVE');
    expect(await submitAssignmentAction(form())).toEqual(NO_ACCESS);
    expectNothingWritten();

    db.memberships.push({ userId: STUDENT, groupId: 'g_morning' });
    expect(await submitAssignmentAction(form())).toEqual({ success: true });
  });

  it("uses the session identity, not another student's entitlement or forged form fields", async () => {
    // The other student is entitled; the signed-in student is not.
    enroll('ACTIVE', 'p_tcf', OTHER_STUDENT);
    const forged = form({ studentId: OTHER_STUDENT, userId: OTHER_STUDENT, status: 'ACTIVE' });
    expect(await submitAssignmentAction(forged)).toEqual(NO_ACCESS);
    expectNothingWritten();
  });

  it('records the submission against the session user even when the form names someone else', async () => {
    enroll('ACTIVE');
    await submitAssignmentAction(form({ studentId: OTHER_STUDENT }));
    expect(db.submissions.map((s) => s.studentId)).toEqual([STUDENT]);
  });

  it('re-reads enrollment at submission time: a student paused after loading the page is rejected', async () => {
    enroll('ACTIVE');
    db.enrollments[0].status = 'PAUSED';
    expect(await submitAssignmentAction(form())).toEqual(NO_ACCESS);
    expectNothingWritten();
  });

  it('rejects an unknown assignment id without writing anything', async () => {
    enroll('ACTIVE');
    const fd = form();
    fd.set('assignmentId', 'a_does_not_exist');
    expect(await submitAssignmentAction(fd)).toEqual({ error: 'This assignment no longer exists.' });
    expectNothingWritten();
  });

  it('does not let an entitled student overwrite an existing submission', async () => {
    enroll('ACTIVE');
    await submitAssignmentAction(form());
    put.mockClear();
    expect(await submitAssignmentAction(form())).toEqual({
      error: 'You already submitted this assignment.',
    });
    expect(db.submissions).toHaveLength(1);
    expect(put).not.toHaveBeenCalled();
  });
});
