import * as Sentry from '@sentry/nextjs';

/**
 * Fire a notification send from inside an admin action without letting a
 * delivery failure roll back or mask the persisted state change. Any error is
 * captured to Sentry and swallowed — the state change already committed and the
 * caller returns success. (`dispatchNotification` itself never throws for a
 * per-recipient problem; this guards the resolution/query work around it.)
 */
export async function notifySafely(
  run: () => Promise<unknown>,
  context: Record<string, string>
): Promise<void> {
  try {
    await run();
  } catch (error) {
    Sentry.captureException(error, { extra: { where: 'notifySafely', ...context } });
  }
}
