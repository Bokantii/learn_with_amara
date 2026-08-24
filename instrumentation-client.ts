import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // No-ops (drops events) when dsn is undefined.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
