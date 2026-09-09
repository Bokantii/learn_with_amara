import type { CefrLevel } from '../generated/prisma/client';

/**
 * Fixed configuration for the assessment engine (SPEC §9.2, §11.9). The
 * placement diagnostic is ICLP's own instrument — these thresholds are not
 * derived from TCF/TEF scoring and must never be presented as an official score.
 */

/** CEFR levels low→high; the placement "ladder" walks this order. */
export const CEFR_LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * A student "clears" a CEFR level when they answer at least this fraction of
 * that level's auto-graded questions correctly. The estimated level is the
 * highest level cleared with every lower level also cleared.
 */
export const PLACEMENT_PASS_RATIO = 0.7;

/** Questions drawn per placement attempt when the assessment sets no explicit count. */
export const DEFAULT_PLACEMENT_QUESTION_COUNT = 20;

/** Hard cap on a single free-text answer, enforced in the save action. */
export const MAX_TEXT_RESPONSE_CHARS = 5000;

export const PLACEMENT_RESULT_DISCLAIMER =
  'This is an ICLP diagnostic estimate to help you pick a starting point — not an official TCF, TEF, DELF or DALF score.';

/**
 * httpOnly cookie that grants a browser temporary ownership of one anonymous
 * placement attempt + its result. Holds the raw claim token; only its SHA-256
 * hex is stored on `AssessmentAttempt.claimTokenHash`. Path-scoped so it is only
 * ever sent to the assessment routes.
 */
export const PLACEMENT_CLAIM_COOKIE = 'placement_attempt';
export const PLACEMENT_CLAIM_COOKIE_PATH = '/assessments';
export const PLACEMENT_CLAIM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
