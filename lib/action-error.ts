/**
 * Thrown by a server action (or the domain code it calls) when the message is
 * safe to show the user as-is. `lib/safe-action.ts`'s `handleServerError`
 * forwards an `ActionError`'s message to `result.serverError`; any other thrown
 * value is logged and replaced with a generic message so internals never leak.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}
