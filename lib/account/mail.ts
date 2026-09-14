import type { ReactElement } from 'react';
import { resend, EMAIL_FROM } from '../email';

/**
 * Fire an account-lifecycle email (invite / password reset). Never throws and
 * never rolls back the caller's state change — returns `{ sent: false }` when
 * email is unconfigured or the provider rejects, so the caller can fall back to
 * surfacing the link to the admin (SPEC §5, Phase 2 Task 11).
 */
export async function sendAccountEmail(opts: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<{ sent: boolean }> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false };
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      react: opts.react,
    });
    if (error) {
      console.error('[account-email] send failed:', error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[account-email] send threw:', err);
    return { sent: false };
  }
}
