/**
 * Fixed configuration for the QR attendance flow (SPEC §11.10). Session
 * duration and the PRESENT/LATE cutoff are deliberately fixed constants, not
 * admin-configurable per session — see the locked-in decisions in the
 * approved plan for this feature.
 */

/** How long a started attendance session stays OPEN before it lazily expires. */
export const ATTENDANCE_SESSION_DURATION_MINUTES = 15;

/**
 * A check-in at or before `startsAt + this many minutes` counts as PRESENT;
 * anything after counts as LATE.
 */
export const ATTENDANCE_LATE_THRESHOLD_MINUTES = 10;

/**
 * Single generic rejection message for every non-enumerable check-in failure
 * (unknown token, closed session, expired session) — a client must not be
 * able to distinguish "wrong token" from "expired" from "already closed".
 */
export const ATTENDANCE_GENERIC_REJECTION_MESSAGE =
  'This attendance link is invalid or has expired.';
