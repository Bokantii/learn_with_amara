/**
 * Splits a student's visible live classes into the Upcoming / Past / Cancelled
 * tabs of /dashboard/liveclasses.
 *
 * Status alone is not enough: a class stays SCHEDULED until an instructor marks
 * it COMPLETED, and if they forget, it would sit under "Upcoming" with a live
 * Join button forever. So a SCHEDULED class only counts as upcoming while it has
 * not ended yet; once `endsAt` has passed it moves to Past, flagged as `ended`
 * (it was never marked completed), and must not offer a join link.
 *
 * `now` is passed in (from the server render) so the result is deterministic
 * and identical on the server and the client.
 */
export type LiveClassTabStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface LiveClassTabInput {
  status: LiveClassTabStatus;
  startsAt: string;
  endsAt: string;
}

export type PastLiveClass<T> = T & { pastKind: 'completed' | 'ended' };

export function partitionLiveClasses<T extends LiveClassTabInput>(
  classes: T[],
  now: Date
): { upcoming: T[]; past: PastLiveClass<T>[]; cancelled: T[] } {
  const nowMs = now.getTime();
  const upcoming: T[] = [];
  const past: PastLiveClass<T>[] = [];
  const cancelled: T[] = [];

  for (const c of classes) {
    if (c.status === 'CANCELLED') {
      cancelled.push(c);
    } else if (c.status === 'COMPLETED') {
      past.push({ ...c, pastKind: 'completed' });
    } else if (new Date(c.endsAt).getTime() > nowMs) {
      upcoming.push(c);
    } else {
      past.push({ ...c, pastKind: 'ended' });
    }
  }

  const byStart = (a: LiveClassTabInput, b: LiveClassTabInput) =>
    new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  upcoming.sort(byStart); // soonest first
  past.sort((a, b) => byStart(b, a)); // most recent first
  cancelled.sort(byStart);

  return { upcoming, past, cancelled };
}
