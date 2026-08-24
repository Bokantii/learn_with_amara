import { Resend } from 'resend';

// Falls back to a placeholder key so the app can build/run without
// RESEND_API_KEY configured — mirrors lib/stripe.ts. Any real send attempt
// will fail clearly (and safely) until a real key is set.
export const resend = new Resend(process.env.RESEND_API_KEY || 're_not_configured');

// Resend requires a verified sending domain in production; this default only
// works for Resend's own sandbox testing until a real domain is configured.
export const EMAIL_FROM = process.env.EMAIL_FROM || 'ICLP <onboarding@resend.dev>';
