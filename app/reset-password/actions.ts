'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { after } from 'next/server';
import { headers } from 'next/headers';
import { publicActionClient } from '../../lib/safe-action';
import { ActionError } from '../../lib/action-error';
import {
  checkInviteAcceptRateLimit,
  checkPasswordResetRateLimit,
  getClientIp,
} from '../../lib/rate-limit';
import { consumeAccountToken, issuePasswordReset } from '../../lib/account/lifecycle';
import { sendAccountEmail } from '../../lib/account/mail';
import { getAppOriginOrEmpty } from '../../lib/app-url';
import PasswordResetEmail from '../../emails/PasswordResetEmail';

const requestSchema = z.object({ email: z.string().trim().email() });

/**
 * Always resolves to the same `{ ok: true }` whether or not the email is
 * registered — no account enumeration. The token mint + email send run in
 * `after()` so the response time doesn't depend on whether a match was found
 * (which would otherwise be a timing oracle). A link is only sent to a real,
 * ACTIVE, password-backed account.
 */
export const requestPasswordResetAction = publicActionClient
  .schema(requestSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp(await headers());
    const rate = await checkPasswordResetRateLimit(`${ip}:${parsedInput.email.toLowerCase()}`);
    if (!rate.success) {
      // Same neutral response — never confirm/deny the address even under throttle.
      return { ok: true };
    }

    const origin = await getAppOriginOrEmpty();
    after(async () => {
      try {
        const { rawToken, recipient } = await issuePasswordReset(parsedInput.email);
        if (rawToken && recipient && origin) {
          await sendAccountEmail({
            to: recipient.email,
            subject: 'Reset your ICLP password',
            react: PasswordResetEmail({
              name: recipient.name,
              resetUrl: `${origin}/reset-password/${rawToken}`,
            }),
          });
        }
      } catch (err) {
        console.error('[password-reset] deferred send failed:', err);
      }
    });

    return { ok: true };
  });

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const resetPasswordAction = publicActionClient
  .schema(resetSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp(await headers());
    const rate = await checkInviteAcceptRateLimit(ip);
    if (!rate.success) {
      throw new ActionError('Too many attempts. Please wait a minute and try again.');
    }

    const passwordHash = await bcrypt.hash(parsedInput.password, 10);
    await consumeAccountToken(parsedInput.token, passwordHash, 'PASSWORD_RESET');
    return { ok: true };
  });
