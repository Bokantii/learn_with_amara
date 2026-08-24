'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import { prisma } from '../../lib/prisma';
import { resend, EMAIL_FROM } from '../../lib/email';
import WelcomeEmail from '../../emails/WelcomeEmail';
import { checkSignUpRateLimit, getClientIp } from '../../lib/rate-limit';

const actionClient = createSafeActionClient();

const signUpSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}

export const signUpAction = actionClient
  .schema(signUpSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp(await headers());
    const rateLimit = await checkSignUpRateLimit(ip);
    if (!rateLimit.success) {
      throw new Error('Too many sign-up attempts. Please wait a minute and try again.');
    }

    const email = parsedInput.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('An account with that email already exists.');
    }

    const passwordHash = await bcrypt.hash(parsedInput.password, 10);
    const name = `${parsedInput.firstName} ${parsedInput.lastName}`.trim();

    await prisma.user.create({
      data: { name, email, passwordHash, role: 'STUDENT' },
    });

    // Don't fail signup if the welcome email couldn't be sent (e.g. no
    // RESEND_API_KEY configured yet locally) — the account is still created.
    // Resend's SDK resolves with { error } rather than throwing, so check
    // both that and a wrapping try/catch for genuine network failures.
    try {
      const appUrl = await getOrigin();
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Welcome to ICLP!',
        react: WelcomeEmail({ name, appUrl }),
      });
      if (error) {
        console.error('Failed to send welcome email:', error);
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { success: true };
  });
