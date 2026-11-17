import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './lib/sentry-options';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...sentryOptions(process.env.NEXT_PUBLIC_VERCEL_ENV),
  // No-ops (drops events) when dsn is undefined.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
