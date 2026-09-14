import { describe, it, expect, vi, beforeEach } from 'vitest';

const dispatchNotification = vi.fn();
const resolveProgramGroupRecipientIds = vi.fn();

const assignmentFindUnique = vi.fn();
const submissionFindUnique = vi.fn();
const enrollmentFindUnique = vi.fn();
const attemptFindUnique = vi.fn();
const lessonFindUnique = vi.fn();
const userFindMany = vi.fn();

vi.mock('./dispatch', () => ({
  dispatchNotification: (...a: unknown[]) => dispatchNotification(...a),
}));
vi.mock('./recipients', () => ({
  resolveProgramGroupRecipientIds: (...a: unknown[]) => resolveProgramGroupRecipientIds(...a),
}));
vi.mock('../app-url', () => ({ getAppOrigin: async () => 'https://test.iclp' }));
vi.mock('../prisma', () => ({
  prisma: {
    assignment: { findUnique: (...a: unknown[]) => assignmentFindUnique(...a) },
    submission: { findUnique: (...a: unknown[]) => submissionFindUnique(...a) },
    enrollment: { findUnique: (...a: unknown[]) => enrollmentFindUnique(...a) },
    assessmentAttempt: { findUnique: (...a: unknown[]) => attemptFindUnique(...a) },
    lesson: { findUnique: (...a: unknown[]) => lessonFindUnique(...a) },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

import {
  sendAssignmentPublishedNotification,
  sendAssignmentGradedNotification,
  sendEnrollmentChangedNotification,
  sendAssessmentGradedNotification,
  sendLessonPublishedNotification,
} from './events';

const STUDENT = { id: 'u1', name: 'Aisha', email: 'aisha@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
  dispatchNotification.mockResolvedValue({ recipients: 1, channels: {} });
  userFindMany.mockResolvedValue([STUDENT]);
  resolveProgramGroupRecipientIds.mockResolvedValue(['u1']);
});

function lastDispatch() {
  return dispatchNotification.mock.calls.at(-1)?.[0];
}

describe('sendAssignmentPublishedNotification', () => {
  it('dispatches to the resolved program/group students with a per-user dedupe key', async () => {
    assignmentFindUnique.mockResolvedValue({
      id: 'a1',
      title: 'Set 3',
      dueDate: new Date('2026-04-05'),
      points: 20,
      programId: 'p1',
      groupId: null,
      program: { name: 'TCF' },
      group: null,
    });
    await sendAssignmentPublishedNotification('a1');
    const d = lastDispatch();
    expect(d.type).toBe('ASSIGNMENT_PUBLISHED');
    expect(d.channels).toEqual(['IN_APP', 'EMAIL']);
    expect(d.recipients[0].dedupeKey).toBe('ASSIGNMENT_PUBLISHED:a1:u1');
  });

  it('does nothing for an unknown assignment', async () => {
    assignmentFindUnique.mockResolvedValue(null);
    expect(await sendAssignmentPublishedNotification('nope')).toBeNull();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});

describe('sendAssignmentGradedNotification', () => {
  const graded = {
    id: 's1',
    status: 'GRADED',
    score: 18,
    feedback: null,
    student: STUDENT,
    assignment: { title: 'Set 3', points: 20 },
  };

  it('keys the dedupe by submission + score so a re-grade re-notifies once', async () => {
    submissionFindUnique.mockResolvedValue(graded);
    await sendAssignmentGradedNotification('s1');
    expect(lastDispatch().recipients[0].dedupeKey).toBe('ASSIGNMENT_GRADED:s1:18');

    submissionFindUnique.mockResolvedValue({ ...graded, score: 19 });
    await sendAssignmentGradedNotification('s1');
    expect(lastDispatch().recipients[0].dedupeKey).toBe('ASSIGNMENT_GRADED:s1:19');
  });

  it('skips a submission that is not GRADED / has no score', async () => {
    submissionFindUnique.mockResolvedValue({ ...graded, status: 'PENDING' });
    expect(await sendAssignmentGradedNotification('s1')).toBeNull();
    submissionFindUnique.mockResolvedValue({ ...graded, score: null });
    expect(await sendAssignmentGradedNotification('s1')).toBeNull();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});

describe('sendEnrollmentChangedNotification', () => {
  it('keys the dedupe by enrollment + status + updatedAt so a repeat transition re-notifies', async () => {
    const t = new Date('2026-03-01T00:00:00Z').getTime();
    enrollmentFindUnique.mockResolvedValue({
      id: 'e1',
      user: STUDENT,
      program: { name: 'TCF' },
      updatedAt: new Date(t),
    });
    await sendEnrollmentChangedNotification('e1', 'ACTIVE');
    expect(lastDispatch().recipients[0].dedupeKey).toBe(`ENROLLMENT_CHANGED:e1:ACTIVE:${t}`);
    expect(lastDispatch().type).toBe('ENROLLMENT_CHANGED');
  });

  it('returns null for a missing enrollment', async () => {
    enrollmentFindUnique.mockResolvedValue(null);
    expect(await sendEnrollmentChangedNotification('gone', 'ACTIVE')).toBeNull();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});

describe('sendAssessmentGradedNotification', () => {
  it('notifies the attempt owner once per attempt', async () => {
    attemptFindUnique.mockResolvedValue({
      id: 'at1',
      status: 'GRADED',
      user: STUDENT,
      assessment: { title: 'Placement' },
    });
    await sendAssessmentGradedNotification('at1');
    expect(lastDispatch().recipients[0].dedupeKey).toBe('ASSESSMENT_GRADED:at1');
  });

  it('skips an anonymous attempt (no user)', async () => {
    attemptFindUnique.mockResolvedValue({
      id: 'at1',
      status: 'GRADED',
      user: null,
      assessment: { title: 'Placement' },
    });
    expect(await sendAssessmentGradedNotification('at1')).toBeNull();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});

describe('sendLessonPublishedNotification', () => {
  it('dispatches to the lesson program’s students when published', async () => {
    lessonFindUnique.mockResolvedValue({
      id: 'l1',
      title: 'Subjunctive',
      published: true,
      module: { title: 'Grammar', program: { id: 'p1', name: 'TCF' } },
    });
    await sendLessonPublishedNotification('l1');
    // resolves recipients for the program (no group narrowing)
    expect(resolveProgramGroupRecipientIds).toHaveBeenCalledWith('p1');
    expect(lastDispatch().recipients[0].dedupeKey).toBe('LESSON_PUBLISHED:l1:u1');
    expect(lastDispatch().type).toBe('LESSON_PUBLISHED');
  });

  it('does nothing for an unpublished lesson', async () => {
    lessonFindUnique.mockResolvedValue({
      id: 'l1',
      title: 'Subjunctive',
      published: false,
      module: { title: 'Grammar', program: { id: 'p1', name: 'TCF' } },
    });
    expect(await sendLessonPublishedNotification('l1')).toBeNull();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});
