import { describe, it, expect } from 'vitest';
import { partitionLiveClasses, type LiveClassTabInput } from './live-class-tabs';

const NOW = new Date('2026-11-13T12:00:00Z');

function cls(id: string, status: LiveClassTabInput['status'], startsAt: string, endsAt: string) {
  return { id, status, startsAt, endsAt };
}

describe('partitionLiveClasses (/dashboard/liveclasses tabs)', () => {
  it('keeps a scheduled class that has not started yet under Upcoming', () => {
    const r = partitionLiveClasses([cls('a', 'SCHEDULED', '2026-11-14T16:00:00Z', '2026-11-14T17:30:00Z')], NOW);
    expect(r.upcoming.map((c) => c.id)).toEqual(['a']);
    expect(r.past).toEqual([]);
  });

  it('keeps a class that is in progress under Upcoming (still joinable)', () => {
    const r = partitionLiveClasses([cls('a', 'SCHEDULED', '2026-11-13T11:30:00Z', '2026-11-13T12:30:00Z')], NOW);
    expect(r.upcoming.map((c) => c.id)).toEqual(['a']);
  });

  it('moves a scheduled class that has ended to Past as "ended", not Upcoming', () => {
    const r = partitionLiveClasses([cls('a', 'SCHEDULED', '2026-09-05T16:00:00Z', '2026-09-05T17:30:00Z')], NOW);
    expect(r.upcoming).toEqual([]);
    expect(r.past.map((c) => [c.id, c.pastKind])).toEqual([['a', 'ended']]);
  });

  it('treats a class ending exactly now as ended', () => {
    const r = partitionLiveClasses([cls('a', 'SCHEDULED', '2026-11-13T11:00:00Z', '2026-11-13T12:00:00Z')], NOW);
    expect(r.past.map((c) => c.pastKind)).toEqual(['ended']);
  });

  it('puts completed classes in Past and cancelled ones in Cancelled, whatever their dates', () => {
    const r = partitionLiveClasses(
      [
        cls('done', 'COMPLETED', '2026-12-01T16:00:00Z', '2026-12-01T17:00:00Z'),
        cls('off', 'CANCELLED', '2026-12-02T16:00:00Z', '2026-12-02T17:00:00Z'),
      ],
      NOW
    );
    expect(r.upcoming).toEqual([]);
    expect(r.past.map((c) => [c.id, c.pastKind])).toEqual([['done', 'completed']]);
    expect(r.cancelled.map((c) => c.id)).toEqual(['off']);
  });

  it('orders Upcoming soonest first and Past most recent first', () => {
    const r = partitionLiveClasses(
      [
        cls('later', 'SCHEDULED', '2026-11-20T16:00:00Z', '2026-11-20T17:00:00Z'),
        cls('sooner', 'SCHEDULED', '2026-11-14T16:00:00Z', '2026-11-14T17:00:00Z'),
        cls('old', 'COMPLETED', '2026-08-20T14:00:00Z', '2026-08-20T15:00:00Z'),
        cls('recent', 'SCHEDULED', '2026-09-08T13:00:00Z', '2026-09-08T14:00:00Z'),
      ],
      NOW
    );
    expect(r.upcoming.map((c) => c.id)).toEqual(['sooner', 'later']);
    expect(r.past.map((c) => c.id)).toEqual(['recent', 'old']);
  });
});
