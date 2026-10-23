import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/** HTTP mapping of check-in throttling for the mobile-ready route (#11). */

const checkIn = vi.fn();

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('../../../../lib/authz', () => ({ getSessionUser: async () => ({ id: 'u_student' }) }));
vi.mock('../../../../lib/attendance/checkin', () => ({
  checkInToAttendanceSession: (...a: unknown[]) => checkIn(...a),
}));

import { POST } from './route';

function post(headers: Record<string, string> = {}) {
  return POST(
    new NextRequest('http://localhost/api/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok', studentUserId: 'someone_else' }),
      headers: { 'content-type': 'application/json', ...headers },
    })
  );
}

beforeEach(() => {
  checkIn.mockReset();
  vi.unstubAllEnvs();
});

describe('POST /api/attendance/checkin rate limiting', () => {
  it('RATE_LIMITED → 429 with Retry-After', async () => {
    checkIn.mockResolvedValue({ ok: false, reason: 'RATE_LIMITED', retryAfterSeconds: 42 });
    const res = await post();
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
  });

  it('TEMPORARILY_UNAVAILABLE → 503 with Retry-After', async () => {
    checkIn.mockResolvedValue({ ok: false, reason: 'TEMPORARILY_UNAVAILABLE', retryAfterSeconds: 60 });
    const res = await post();
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('passes the session identity and platform IP, never body fields or a spoofed header off-platform', async () => {
    checkIn.mockResolvedValue({ ok: false, reason: 'INVALID_OR_EXPIRED' });
    await post({ 'x-forwarded-for': '6.6.6.6' });
    expect(checkIn).toHaveBeenCalledWith({ rawToken: 'tok', studentUserId: 'u_student', clientIp: 'unknown' });

    vi.stubEnv('VERCEL', '1');
    await post({ 'x-real-ip': '203.0.113.7' });
    expect(checkIn).toHaveBeenLastCalledWith({ rawToken: 'tok', studentUserId: 'u_student', clientIp: '203.0.113.7' });
  });
});
