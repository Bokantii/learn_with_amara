import type { EnrollmentStatus } from '../generated/prisma/client';

/**
 * Single source of truth for what each `Enrollment.status` means and which
 * transitions between them are legal (SPEC §6, Phase 2 Task 9).
 *
 * Three status *sets*, deliberately different:
 *
 *  - VISIBLE  — the student can SEE the program on their dashboard (everything
 *    except a cancelled enrollment). Gates the dashboard shell, the live-class
 *    and attendance lists.
 *  - CONTENT_ACCESS — the student may OPEN course content (lessons, recorded
 *    lessons, program assignments, practice tests). Narrower: a PENDING (not yet
 *    activated / unpaid) or PAUSED enrollment can be seen but not used.
 *  - NOTIFY   — receives PUSHED communication (email + in-app bell). Narrowest.
 */
export const VISIBLE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
];

export const CONTENT_ACCESS_ENROLLMENT_STATUSES: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED'];

export const NOTIFY_ENROLLMENT_STATUSES: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED'];

/**
 * Legal next states for each status. Enrollment activation is **admin-approved**
 * (Task 9 decision B): a new enrollment starts `PENDING` and an admin moves it
 * to `ACTIVE` explicitly — a recorded payment never does it automatically.
 * A `CANCELLED` enrollment is re-opened in place (the `@@unique([userId,
 * programId])` prevents a second row for the same pair).
 */
export const ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  PENDING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['ACTIVE'],
  CANCELLED: ['PENDING', 'ACTIVE'],
};

/** Statuses that record an end date (`Enrollment.endedAt`). */
export const TERMINAL_ENROLLMENT_STATUSES: EnrollmentStatus[] = ['COMPLETED', 'CANCELLED'];

/** True when `to` is `from` (idempotent no-op) or an allowed transition of `from`. */
export function canTransition(from: EnrollmentStatus, to: EnrollmentStatus): boolean {
  return from === to || ENROLLMENT_TRANSITIONS[from].includes(to);
}

/** Throws a human-readable error when `from → to` is not allowed. */
export function assertTransition(from: EnrollmentStatus, to: EnrollmentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot move an enrollment from ${from} to ${to}.`);
  }
}
