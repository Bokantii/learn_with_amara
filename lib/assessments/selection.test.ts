import { describe, it, expect } from 'vitest';
import { selectQuestions } from './selection';
import type { CefrLevel } from '../generated/prisma/client';

function q(id: string, cefrLevel: CefrLevel | null) {
  return { id, cefrLevel };
}

describe('selectQuestions', () => {
  it('round-robins across levels in ladder order', () => {
    const pool = [
      q('a1-1', 'A1'), q('a1-2', 'A1'),
      q('b1-1', 'B1'), q('b1-2', 'B1'),
      q('c1-1', 'C1'), q('c1-2', 'C1'),
    ];
    expect(selectQuestions(pool, 6).map((x) => x.id)).toEqual([
      'a1-1', 'b1-1', 'c1-1', 'a1-2', 'b1-2', 'c1-2',
    ]);
  });

  it('draws exactly `count`, balanced, when the pool is larger', () => {
    const pool = [
      q('a-1', 'A1'), q('a-2', 'A1'), q('a-3', 'A1'),
      q('b-1', 'B1'), q('b-2', 'B1'), q('b-3', 'B1'),
    ];
    const picked = selectQuestions(pool, 4).map((x) => x.id);
    expect(picked).toHaveLength(4);
    expect(picked.filter((id) => id.startsWith('a'))).toHaveLength(2);
    expect(picked.filter((id) => id.startsWith('b'))).toHaveLength(2);
  });

  it('returns the whole pool when count exceeds it or is <= 0', () => {
    const pool = [q('x', 'A1'), q('y', 'B1')];
    expect(selectQuestions(pool, 99)).toHaveLength(2);
    expect(selectQuestions(pool, 0)).toHaveLength(2);
  });

  it('places questions with no level last', () => {
    const pool = [q('none-1', null), q('a1-1', 'A1'), q('none-2', null)];
    expect(selectQuestions(pool, 3).map((x) => x.id)).toEqual(['a1-1', 'none-1', 'none-2']);
  });

  it('is stable — same input, same output (freezable into the snapshot)', () => {
    const pool = [q('a', 'A1'), q('b', 'A2'), q('c', 'B1')];
    expect(selectQuestions(pool, 2)).toEqual(selectQuestions([...pool], 2));
  });
});
