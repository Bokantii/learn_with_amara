import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  // No-ops (drops events) when dsn is undefined — safe to run without
  // Sentry configured, matching the graceful-degradation pattern used for
  // Stripe/Resend/Blob/Upstash elsewhere in this codebase.
});
