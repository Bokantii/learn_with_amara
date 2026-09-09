import { describe, it, expect } from 'vitest';
import { CHECK_IN_PATH, buildCheckInPath, buildCheckInUrl } from './url';

describe('attendance check-in URL helpers', () => {
  it('buildCheckInPath produces a same-origin relative path with the token url-encoded', () => {
    expect(buildCheckInPath('abc-123')).toBe('/attendance/checkin?token=abc-123');
    expect(buildCheckInPath('a b/c+d')).toBe(`${CHECK_IN_PATH}?token=a%20b%2Fc%2Bd`);
  });

  it('buildCheckInUrl prefixes the origin without doubling the slash', () => {
    expect(buildCheckInUrl('https://app.iclp.com', 'tok')).toBe(
      'https://app.iclp.com/attendance/checkin?token=tok'
    );
  });

  it('round-trips through URLSearchParams back to the raw token', () => {
    const raw = 'Zm9vL2Jhcit4eXo=';
    const url = new URL(buildCheckInUrl('http://localhost:3000', raw));
    expect(url.searchParams.get('token')).toBe(raw);
    expect(url.pathname).toBe(CHECK_IN_PATH);
  });
});
