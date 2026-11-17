import type { CefrLevel } from '../generated/prisma/client';
import { CEFR_LEVEL_ORDER } from './constants';

/**
 * Balanced question selection for an attempt (SPEC §9.2 "select an appropriate
 * balanced set"). Round-robin across the CEFR levels present, in ladder order,
 * until `count` is reached or the pool is exhausted; questions with no level are
 * drawn last. Pure — the caller shuffles the pool beforehand for variety, and
 * the result is then frozen into `AssessmentAttemptQuestion` so a resumed
 * attempt always sees the same set in the same order.
 */

export interface SelectableQuestion {
  id: string;
  cefrLevel: CefrLevel | null;
}

export function selectQuestions<T extends SelectableQuestion>(pool: T[], count: number): T[] {
  const target = count > 0 ? count : pool.length;

  const buckets: T[][] = CEFR_LEVEL_ORDER.map(() => []);
  const bucketIndex = new Map<CefrLevel, number>(
    CEFR_LEVEL_ORDER.map((level, i) => [level, i])
  );
  const noLevel: T[] = [];

  for (const q of pool) {
    const idx = q.cefrLevel != null ? bucketIndex.get(q.cefrLevel) : undefined;
    if (idx === undefined) noLevel.push(q);
    else buckets[idx].push(q);
  }

  const ordered = [...buckets, noLevel];
  const picked: T[] = [];
  let progressed = true;
  while (picked.length < target && progressed) {
    progressed = false;
    for (const bucket of ordered) {
      if (picked.length >= target) break;
      const next = bucket.shift();
      if (next) {
        picked.push(next);
        progressed = true;
      }
    }
  }
  return picked;
}
