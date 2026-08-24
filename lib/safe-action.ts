import { createSafeActionClient } from 'next-safe-action';
import { auth } from '../auth';

const actionClient = createSafeActionClient();

export const adminActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: admin access required.');
  }

  return next({ ctx: { adminId: session.user.id } });
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('You must be signed in to do that.');
  }

  return next({ ctx: { userId: session.user.id } });
});
