import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './lib/sentry-options';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  ...sentryOptions(process.env.VERCEL_ENV),
  // No-ops (drops events) when dsn is undefined — safe to run without
  // Sentry configured, matching the graceful-degradation pattern used for
  // Stripe/Resend/Blob/Upstash elsewhere in this codebase.
});
