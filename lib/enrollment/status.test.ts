import { describe, it, expect } from 'vitest';
import type { EnrollmentStatus } from '../generated/prisma/client';
import {
  canTransition,
  assertTransition,
  ENROLLMENT_TRANSITIONS,
  CONTENT_ACCESS_ENROLLMENT_STATUSES,
  VISIBLE_ENROLLMENT_STATUSES,
} from './status';

const ALL: EnrollmentStatus[] = ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];

describe('canTransition', () => {
  it('allows every declared transition', () => {
    for (const from of ALL) {
      for (const to of ENROLLMENT_TRANSITIONS[from]) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });

  it('treats a no-op (same status) as allowed', () => {
    for (const s of ALL) expect(canTransition(s, s)).toBe(true);
  });

  it('rejects transitions that are not declared', () => {
    for (const from of ALL) {
      const allowed = new Set<EnrollmentStatus>([from, ...ENROLLMENT_TRANSITIONS[from]]);
      for (const to of ALL) {
        if (!allowed.has(to)) expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it('rejects the specific illegal moves the admin UI must guard', () => {
    expect(canTransition('PENDING', 'PAUSED')).toBe(false);
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(canTransition('ACTIVE', 'PENDING')).toBe(false);
    expect(canTransition('COMPLETED', 'PAUSED')).toBe(false);
    expect(canTransition('CANCELLED', 'PAUSED')).toBe(false);
    expect(canTransition('CANCELLED', 'COMPLETED')).toBe(false);
  });

  it('lets a cancelled enrollment be re-opened', () => {
    expect(canTransition('CANCELLED', 'PENDING')).toBe(true);
    expect(canTransition('CANCELLED', 'ACTIVE')).toBe(true);
  });
});

describe('assertTransition', () => {
  it('throws with a readable message on an illegal move', () => {
    expect(() => assertTransition('PENDING', 'PAUSED')).toThrow(
      'Cannot move an enrollment from PENDING to PAUSED.'
    );
  });

  it('does not throw on a legal move or a no-op', () => {
    expect(() => assertTransition('PENDING', 'ACTIVE')).not.toThrow();
    expect(() => assertTransition('ACTIVE', 'ACTIVE')).not.toThrow();
  });
});

describe('status sets', () => {
  it('content access is ACTIVE / COMPLETED only', () => {
    expect(CONTENT_ACCESS_ENROLLMENT_STATUSES).toEqual(['ACTIVE', 'COMPLETED']);
    expect(CONTENT_ACCESS_ENROLLMENT_STATUSES).not.toContain('PENDING');
    expect(CONTENT_ACCESS_ENROLLMENT_STATUSES).not.toContain('PAUSED');
    expect(CONTENT_ACCESS_ENROLLMENT_STATUSES).not.toContain('CANCELLED');
  });

  it('visible = everything but CANCELLED', () => {
    expect(new Set(VISIBLE_ENROLLMENT_STATUSES)).toEqual(
      new Set(['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED'])
    );
  });
});
