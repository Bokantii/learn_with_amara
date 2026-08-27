'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import { prisma } from './prisma';
import { checkNewsletterRateLimit, getClientIp } from './rate-limit';

const actionClient = createSafeActionClient();

const newsletterSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

export const subscribeToNewsletterAction = actionClient
  .schema(newsletterSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp(await headers());
    const rateLimit = await checkNewsletterRateLimit(ip);
    if (!rateLimit.success) {
      throw new Error('Too many attempts. Please wait a minute and try again.');
    }

    const email = parsedInput.email.toLowerCase();

    try {
      await prisma.newsletterSubscriber.create({ data: { email } });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return { success: true, alreadySubscribed: true };
      }
      throw error;
    }

    return { success: true, alreadySubscribed: false };
  });
