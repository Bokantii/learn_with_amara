/**
 * Shared vocabulary for the notification domain. The string unions mirror the
 * Prisma enums (`NotificationType`, `NotificationChannel`, `NotificationStatus`)
 * — the codebase passes enum values as string literals rather than importing the
 * generated enums.
 *
 * Adding a future notification type (ASSIGNMENT_CREATED, SUBMISSION_GRADED, …)
 * touches this file, the Prisma enum, a new email template, and a new thin
 * caller — never the generic dispatch core in `dispatch.ts`.
 */

export type NotificationTypeValue =
  | 'CLASS_REMINDER'
  | 'CLASS_CANCELLED'
  | 'CLASS_RESCHEDULED'
  | 'ANNOUNCEMENT'
  | 'ASSIGNMENT_PUBLISHED'
  | 'ASSIGNMENT_GRADED'
  | 'ENROLLMENT_CHANGED'
  | 'ASSESSMENT_GRADED'
  | 'LESSON_PUBLISHED';

export type NotificationChannelValue = 'EMAIL' | 'IN_APP';

/**
 * How many times a single (dedupeKey, channel) delivery may be attempted before
 * the scheduler stops retrying it. Bounds a transient provider failure without
 * ever allowing a duplicate successful send.
 */
export const MAX_DELIVERY_ATTEMPTS = 3;
