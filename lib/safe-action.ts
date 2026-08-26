import { createSafeActionClient } from 'next-safe-action';
import { getSessionUser } from './authz';

const actionClient = createSafeActionClient();

export const adminActionClient = actionClient.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: admin access required.');
  }

  return next({ ctx: { adminId: user.id } });
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user?.id) {
    throw new Error('You must be signed in to do that.');
  }

  return next({ ctx: { userId: user.id } });
});
