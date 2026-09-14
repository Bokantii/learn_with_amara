'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { publicActionClient } from '../../lib/safe-action';
import { ActionError } from '../../lib/action-error';
import { checkInviteAcceptRateLimit, getClientIp } from '../../lib/rate-limit';
import { consumeAccountToken } from '../../lib/account/lifecycle';

const acceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Activate an invited account by setting its first password. The role, name and
 * email are whatever the admin provisioned — the client sends only the token and
 * the chosen password, so nothing here can escalate a role.
 */
export const acceptInviteAction = publicActionClient
  .schema(acceptSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp(await headers());
    const rate = await checkInviteAcceptRateLimit(ip);
    if (!rate.success) {
      throw new ActionError('Too many attempts. Please wait a minute and try again.');
    }

    const passwordHash = await bcrypt.hash(parsedInput.password, 10);
    await consumeAccountToken(parsedInput.token, passwordHash, 'INVITE');
    return { ok: true };
  });
