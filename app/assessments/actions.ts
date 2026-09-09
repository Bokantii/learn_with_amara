'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { publicActionClient } from '../../lib/safe-action';
import {
  checkAssessmentAttemptRateLimit,
  getClientIp,
  rateLimitConfigured,
} from '../../lib/rate-limit';
import {
  MAX_TEXT_RESPONSE_CHARS,
  PLACEMENT_CLAIM_COOKIE,
  PLACEMENT_CLAIM_COOKIE_MAX_AGE,
  PLACEMENT_CLAIM_COOKIE_PATH,
} from '../../lib/assessments/constants';
import { generateClaimToken, type AttemptActor } from '../../lib/assessments/ownership';
import { getRequestActor } from '../../lib/assessments/request-actor';
import {
  startOrResumeAttempt,
  recordResponse,
  submitAttempt,
} from '../../lib/assessments/attempt';

/**
 * Placement-test actions — deliberately **public** (`publicActionClient`). The
 * caller's identity is resolved here from the session **and/or** the httpOnly
 * `placement_attempt` claim cookie, never from the request body. Failure reasons
 * are returned as success data (a discriminated union), not thrown.
 *
 * PRACTICE assessments still require a signed-in, entitled student — that guard
 * lives in `startOrResumeAttempt` (`AUTH_REQUIRED` / `NOT_ENTITLED`).
 */

async function rateLimitKey(actor: AttemptActor): Promise<string> {
  if (actor.userId) return `u:${actor.userId}`;
  return `ip:${getClientIp(await headers())}`;
}

const startSchema = z.object({ assessmentId: z.string().min(1) });

export const startAssessmentAction = publicActionClient
  .schema(startSchema)
  .action(async ({ parsedInput }) => {
    const actor = await getRequestActor();

    // The anonymous branch is an unauthenticated row-writer. If no real rate
    // limiter is configured, fail *closed* in production rather than let it run
    // uncapped (dev/test have no Upstash and are unaffected).
    if (
      !actor.userId &&
      !rateLimitConfigured &&
      process.env.NODE_ENV === 'production'
    ) {
      return { ok: false as const, error: 'RATE_LIMITED' as const };
    }

    const rate = await checkAssessmentAttemptRateLimit(await rateLimitKey(actor));
    if (!rate.success) {
      return { ok: false as const, error: 'RATE_LIMITED' as const };
    }

    // Mint a claim token up front so an anonymous *new* attempt can be owned by
    // this browser. It is only persisted (as a hash) + set as a cookie if a new
    // anonymous attempt is actually created.
    const claim = actor.userId ? null : generateClaimToken();

    const result = await startOrResumeAttempt({
      assessmentId: parsedInput.assessmentId,
      actor,
      newClaimTokenHash: claim?.hash ?? null,
    });
    if (!result.ok) return { ok: false as const, error: result.error };

    if (result.createdAnonymous && claim) {
      const proto = (await headers()).get('x-forwarded-proto');
      (await cookies()).set(PLACEMENT_CLAIM_COOKIE, claim.raw, {
        httpOnly: true,
        sameSite: 'lax',
        secure: proto === 'https' || process.env.NODE_ENV === 'production',
        path: PLACEMENT_CLAIM_COOKIE_PATH,
        maxAge: PLACEMENT_CLAIM_COOKIE_MAX_AGE,
      });
    }

    revalidatePath('/assessments');
    return { ok: true as const, attemptId: result.attemptId };
  });

const saveSchema = z
  .object({
    attemptId: z.string().min(1),
    questionId: z.string().min(1),
    selectedOptionId: z.string().min(1).optional(),
    textResponse: z.string().max(MAX_TEXT_RESPONSE_CHARS).optional(),
  })
  .refine((v) => v.selectedOptionId !== undefined || v.textResponse !== undefined, {
    message: 'An answer is required.',
  });

export const saveAssessmentResponseAction = publicActionClient
  .schema(saveSchema)
  .action(async ({ parsedInput }) => {
    const result = await recordResponse({
      actor: await getRequestActor(),
      attemptId: parsedInput.attemptId,
      questionId: parsedInput.questionId,
      selectedOptionId: parsedInput.selectedOptionId ?? null,
      textResponse: parsedInput.textResponse ?? null,
    });
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const };
  });

const submitSchema = z.object({ attemptId: z.string().min(1) });

export const submitAssessmentAttemptAction = publicActionClient
  .schema(submitSchema)
  .action(async ({ parsedInput }) => {
    const result = await submitAttempt({
      actor: await getRequestActor(),
      attemptId: parsedInput.attemptId,
    });
    if (!result.ok) return { ok: false as const, error: result.error };

    revalidatePath('/assessments');
    revalidatePath(`/assessments/result/${parsedInput.attemptId}`);
    return { ok: true as const, status: result.status };
  });
