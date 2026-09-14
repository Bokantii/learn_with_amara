import { prisma } from '../prisma';
import { getAppOrigin } from '../app-url';
import { resolveProgramGroupRecipientIds } from './recipients';
import { dispatchNotification, type NotificationRecipientInput } from './dispatch';
import GradePostedEmail from '../../emails/GradePostedEmail';
import AssignmentPublishedEmail from '../../emails/AssignmentPublishedEmail';
import EnrollmentChangedEmail from '../../emails/EnrollmentChangedEmail';
import AssessmentGradedEmail from '../../emails/AssessmentGradedEmail';
import LessonPublishedEmail from '../../emails/LessonPublishedEmail';

/**
 * Thin per-event callers of `dispatchNotification` (SPEC §12). Each re-reads the
 * authoritative entity, resolves recipients fresh (never a captured list),
 * builds copy + a deterministic dedupe key, and delegates all delivery
 * mechanics to dispatch. Fire these through `notifySafely` from the admin action
 * that owns the state change.
 */

const IN_APP_EMAIL = ['IN_APP', 'EMAIL'] as const;

/**
 * Absolute origin for links inside notification emails. Prefers
 * `NEXT_PUBLIC_APP_URL` (via `getAppOrigin`); in dev it derives from the request
 * headers. Never throws — if the origin can't be resolved (prod misconfig) it
 * yields '' so the email still sends and, crucially, the in-app notification is
 * still created. `notifySafely` is not relied on to swallow this.
 */
export async function originForEmails(): Promise<string> {
  try {
    return await getAppOrigin();
  } catch {
    return '';
  }
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function usersById(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
}

// ─── Assignment published ────────────────────────────────────────────────
export async function sendAssignmentPublishedNotification(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { program: { select: { name: true } }, group: { select: { name: true } } },
  });
  if (!assignment) return null;

  const ids = await resolveProgramGroupRecipientIds(assignment.programId, assignment.groupId);
  const users = await usersById(ids);
  if (users.length === 0) return { recipients: 0, channels: {} };

  const appUrl = await originForEmails();
  const dueFormatted = fmtDate(assignment.dueDate);
  const title = `New assignment: ${assignment.title}`;
  const message = `${assignment.program.name}${
    assignment.group ? ` · ${assignment.group.name}` : ''
  } — due ${dueFormatted}.`;

  return dispatchNotification({
    type: 'ASSIGNMENT_PUBLISHED',
    relatedEntityType: 'Assignment',
    relatedEntityId: assignment.id,
    channels: [...IN_APP_EMAIL],
    recipients: users.map<NotificationRecipientInput>((user) => ({
      user,
      dedupeKey: `ASSIGNMENT_PUBLISHED:${assignment.id}:${user.id}`,
      title,
      message,
      emailMessage: {
        subject: `New assignment: ${assignment.title}`,
        react: AssignmentPublishedEmail({
          studentName: user.name,
          assignmentTitle: assignment.title,
          programName: assignment.program.name,
          groupName: assignment.group?.name,
          dueDateFormatted: dueFormatted,
          points: assignment.points,
          appUrl,
        }),
      },
    })),
  });
}

// ─── Assignment graded ──────────────────────────────────────────────────
export async function sendAssignmentGradedNotification(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: { select: { id: true, name: true, email: true } }, assignment: true },
  });
  if (!submission || submission.status !== 'GRADED' || submission.score == null) return null;

  const appUrl = await originForEmails();
  const title = `Grade posted: ${submission.assignment.title}`;
  const message = `You scored ${submission.score} / ${submission.assignment.points}.`;

  return dispatchNotification({
    type: 'ASSIGNMENT_GRADED',
    relatedEntityType: 'Submission',
    relatedEntityId: submission.id,
    channels: [...IN_APP_EMAIL],
    recipients: [
      {
        user: submission.student,
        // score in the key: a corrected grade re-notifies exactly once.
        dedupeKey: `ASSIGNMENT_GRADED:${submission.id}:${submission.score}`,
        title,
        message,
        emailMessage: {
          subject: `Your grade for "${submission.assignment.title}" is in`,
          react: GradePostedEmail({
            studentName: submission.student.name,
            assignmentTitle: submission.assignment.title,
            score: submission.score,
            feedback: submission.feedback ?? undefined,
            appUrl,
          }),
        },
      },
    ],
  });
}

// ─── Enrollment changed ─────────────────────────────────────────────────
export async function sendEnrollmentChangedNotification(enrollmentId: string, status: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      program: { select: { name: true } },
    },
  });
  if (!enrollment) return null;

  const appUrl = await originForEmails();
  const statusLabel = status.toLowerCase();
  const title = `Enrollment ${statusLabel}: ${enrollment.program.name}`;
  const message = `Your enrollment in ${enrollment.program.name} is now ${statusLabel}.`;

  return dispatchNotification({
    type: 'ENROLLMENT_CHANGED',
    relatedEntityType: 'Enrollment',
    relatedEntityId: enrollment.id,
    channels: [...IN_APP_EMAIL],
    recipients: [
      {
        user: enrollment.user,
        // `updatedAt` in the key: every real transition — including a repeat
        // like PAUSED -> ACTIVE -> PAUSED — notifies once (mirrors the
        // reschedule pattern), while a retry within one dispatch run is deduped.
        dedupeKey: `ENROLLMENT_CHANGED:${enrollment.id}:${status}:${enrollment.updatedAt.getTime()}`,
        title,
        message,
        emailMessage: {
          subject: title,
          react: EnrollmentChangedEmail({
            studentName: enrollment.user.name,
            programName: enrollment.program.name,
            statusLabel,
            appUrl,
          }),
        },
      },
    ],
  });
}

// ─── Assessment result finalized ────────────────────────────────────────
export async function sendAssessmentGradedNotification(attemptId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assessment: { select: { title: true } },
    },
  });
  // Anonymous placement attempts have no user — nobody to notify.
  if (!attempt || !attempt.user || attempt.status !== 'GRADED') return null;

  const appUrl = await originForEmails();
  const title = `Result ready: ${attempt.assessment.title}`;
  const message = 'An instructor has finished reviewing your assessment.';

  return dispatchNotification({
    type: 'ASSESSMENT_GRADED',
    relatedEntityType: 'AssessmentAttempt',
    relatedEntityId: attempt.id,
    channels: [...IN_APP_EMAIL],
    recipients: [
      {
        user: attempt.user,
        dedupeKey: `ASSESSMENT_GRADED:${attempt.id}`,
        title,
        message,
        emailMessage: {
          subject: title,
          react: AssessmentGradedEmail({
            studentName: attempt.user.name,
            assessmentTitle: attempt.assessment.title,
            appUrl,
          }),
        },
      },
    ],
  });
}

// ─── Lesson published ──────────────────────────────────────────────────
export async function sendLessonPublishedNotification(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { program: { select: { id: true, name: true } } } },
    },
  });
  if (!lesson || !lesson.published) return null;

  const ids = await resolveProgramGroupRecipientIds(lesson.module.program.id);
  const users = await usersById(ids);
  if (users.length === 0) return { recipients: 0, channels: {} };

  const appUrl = await originForEmails();
  const title = `New lesson: ${lesson.title}`;
  const message = `${lesson.module.program.name} · ${lesson.module.title}`;

  return dispatchNotification({
    type: 'LESSON_PUBLISHED',
    relatedEntityType: 'Lesson',
    relatedEntityId: lesson.id,
    channels: [...IN_APP_EMAIL],
    recipients: users.map<NotificationRecipientInput>((user) => ({
      user,
      // No time component: unpublish -> republish of the same lesson is a no-op.
      dedupeKey: `LESSON_PUBLISHED:${lesson.id}:${user.id}`,
      title,
      message,
      emailMessage: {
        subject: `New lesson: ${lesson.title}`,
        react: LessonPublishedEmail({
          studentName: user.name,
          lessonTitle: lesson.title,
          moduleName: lesson.module.title,
          programName: lesson.module.program.name,
          appUrl,
        }),
      },
    })),
  });
}
