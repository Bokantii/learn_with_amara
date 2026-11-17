import { createSafeActionClient } from 'next-safe-action';
import { getSessionUser } from './authz';
import { ActionError } from './action-error';

const actionClient = createSafeActionClient({
  // Forward an intentional `ActionError` message to the client (guard failures,
  // validation the schema can't express). Anything else is an unexpected fault:
  // log it server-side and return a generic message so internals never leak.
  handleServerError(e) {
    if (e instanceof ActionError) return e.message;
    console.error('Unexpected action error:', e);
    return 'Something went wrong. Please try again.';
  },
});

/**
 * No auth middleware — for genuinely public mutations (the anonymous placement
 * test). Callers resolve their own actor (session user and/or the claim-token
 * cookie). Cross-site invocation is still blocked by Next's built-in Server
 * Action Origin/Host check plus the `sameSite: 'lax'` cookies.
 */
export const publicActionClient = actionClient;

export const adminActionClient = actionClient.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user || user.role !== 'ADMIN') {
    throw new ActionError('Unauthorized: admin access required.');
  }

  return next({ ctx: { adminId: user.id } });
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user?.id) {
    throw new ActionError('You must be signed in to do that.');
  }

  return next({ ctx: { userId: user.id } });
});

/**
 * Staff = ADMIN or INSTRUCTOR. Used by the attendance-management actions
 * (SPEC §4.3 / §11.6: instructors may run attendance). This is the first
 * INSTRUCTOR-authorized mutation path in the app — every other admin action
 * still uses the stricter `adminActionClient`.
 */
export const staffActionClient = actionClient.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
    throw new ActionError('Unauthorized: staff access required.');
  }

  return next({ ctx: { staffId: user.id, staffRole: user.role } });
});
