import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Rate-limit policy (SPEC #11). Upstash is never called: `@upstash/ratelimit`
 * is replaced by an in-memory fake whose per-prefix behaviour each test can
 * override (count, throw, or time out). The module is re-imported per test so
 * its lazily resolved mode picks up the stubbed environment.
 */

type LimitResponse = { success: boolean; remaining: number; reset: number; reason?: string };

const upstash = {
  constructed: [] as { prefix: string; timeout?: number; tokens: number }[],
  redisClients: [] as { url: string; token: string }[],
  counts: new Map<string, number>(),
  override: null as null | ((prefix: string, key: string) => Promise<LimitResponse>),
};

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(opts: { url: string; token: string }) {
      upstash.redisClients.push(opts);
    }
  },
}));

vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow(tokens: number) {
      return { tokens };
    }
    private prefix: string;
    private tokens: number;
    constructor(opts: { prefix: string; timeout?: number; limiter: { tokens: number } }) {
      this.prefix = opts.prefix;
      this.tokens = opts.limiter.tokens;
      upstash.constructed.push({ prefix: opts.prefix, timeout: opts.timeout, tokens: opts.limiter.tokens });
    }
    async limit(key: string): Promise<LimitResponse> {
      if (upstash.override) return upstash.override(this.prefix, key);
      const bucket = `${this.prefix}:${key}`;
      const used = (upstash.counts.get(bucket) ?? 0) + 1;
      upstash.counts.set(bucket, used);
      return {
        success: used <= this.tokens,
        remaining: Math.max(0, this.tokens - used),
        reset: Date.now() + 60_000,
      };
    }
  }
  return { Ratelimit };
});

const captureMessage = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureMessage: (...a: unknown[]) => captureMessage(...a) }));

async function load() {
  vi.resetModules();
  return import('./rate-limit');
}

function withUpstash() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');
}

async function exhaust(fn: () => Promise<{ success: boolean }>, times: number) {
  const results = [];
  for (let i = 0; i < times; i++) results.push((await fn()).success);
  return results;
}

beforeEach(() => {
  upstash.constructed = [];
  upstash.redisClients = [];
  upstash.counts = new Map();
  upstash.override = null;
  captureMessage.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
  vi.stubEnv('KV_REST_API_READ_ONLY_TOKEN', '');
  vi.stubEnv('VERCEL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('with Upstash configured', () => {
  beforeEach(withUpstash);

  it('allows requests under the limit and denies the next one as limited', async () => {
    const rl = await load();
    const results = await exhaust(() => rl.checkInviteAcceptRateLimit('1.2.3.4'), 6);
    expect(results).toEqual([true, true, true, true, true, false]);
    const denied = await rl.checkInviteAcceptRateLimit('1.2.3.4');
    expect(denied).toMatchObject({ success: false, reason: 'limited' });
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('sets a short Upstash timeout instead of the 5s library default', async () => {
    const rl = await load();
    await rl.checkLoginRateLimit({ ip: '1.1.1.1', email: 'a@x.com' });
    expect(upstash.constructed.every((c) => c.timeout === 1500)).toBe(true);
  });

  it('login: the per-account limit holds even when the attacker rotates IPs', async () => {
    const rl = await load();
    const results = [];
    for (let i = 0; i < 21; i++) {
      results.push((await rl.checkLoginRateLimit({ ip: `10.0.0.${i}`, email: 'victim@x.com' })).success);
    }
    expect(results.slice(0, 20).every(Boolean)).toBe(true);
    expect(results[20]).toBe(false);
  });

  it('login: email case and whitespace variants share one bucket', async () => {
    const rl = await load();
    const variants = ['a@x.com', 'A@X.com', ' a@x.COM ', 'a@X.com', 'A@x.com', 'a@x.com'];
    const results = [];
    for (const email of variants) results.push((await rl.checkLoginRateLimit({ ip: '1.1.1.1', email })).success);
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it('denies when any key in a composite check denies', async () => {
    const rl = await load();
    // Burn the sign-up per-email budget from different IPs.
    await exhaust(() => rl.checkSignUpRateLimit({ ip: `${Math.random()}`, email: 'new@x.com' }), 3);
    const result = await rl.checkSignUpRateLimit({ ip: 'fresh-ip', email: 'new@x.com' });
    expect(result).toMatchObject({ success: false, reason: 'limited' });
  });

  it('keeps endpoint limits separate (reset completion does not consume invite budget)', async () => {
    const rl = await load();
    await exhaust(() => rl.checkPasswordResetCompleteRateLimit('9.9.9.9'), 5);
    expect((await rl.checkPasswordResetCompleteRateLimit('9.9.9.9')).success).toBe(false);
    expect((await rl.checkInviteAcceptRateLimit('9.9.9.9')).success).toBe(true);
  });

  it('every limiter uses a distinct Redis prefix', async () => {
    const rl = await load();
    await rl.checkLoginRateLimit({ ip: 'i', email: 'e@x.com' });
    await rl.checkSignUpRateLimit({ ip: 'i', email: 'e@x.com' });
    await rl.checkPasswordResetRequestRateLimit({ ip: 'i', email: 'e@x.com' });
    await rl.checkPasswordResetCompleteRateLimit('i');
    await rl.checkInviteAcceptRateLimit('i');
    await rl.checkAttendanceCheckInRateLimit({ studentUserId: 'u', ip: 'i' });
    await rl.checkNewsletterRateLimit('i');
    await rl.checkAssessmentAttemptRateLimit('i');
    const prefixes = upstash.constructed.map((c) => c.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    expect(prefixes).toHaveLength(14);
  });

  it('check-in: a shared classroom IP does not block students individually', async () => {
    const rl = await load();
    for (let s = 0; s < 30; s++) {
      expect((await rl.checkAttendanceCheckInRateLimit({ studentUserId: `u${s}`, ip: 'school' })).success).toBe(true);
    }
    // ...but one student hammering is still capped.
    await exhaust(() => rl.checkAttendanceCheckInRateLimit({ studentUserId: 'u0', ip: 'school' }), 9);
    expect((await rl.checkAttendanceCheckInRateLimit({ studentUserId: 'u0', ip: 'school' })).success).toBe(false);
  });

  it('Upstash error: falls back to bounded in-memory limits and reports once', async () => {
    upstash.override = async () => {
      throw new Error('ECONNRESET');
    };
    const rl = await load();
    const results = await exhaust(() => rl.checkInviteAcceptRateLimit('1.2.3.4'), 6);
    expect(results).toEqual([true, true, true, true, true, false]);
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(String(captureMessage.mock.calls[0][0])).not.toContain('1.2.3.4');
  });

  it('Upstash timeout (library resolves success:true) is NOT a silent allow', async () => {
    upstash.override = async () => ({ success: true, remaining: 0, reset: 0, reason: 'timeout' });
    const rl = await load();
    const results = await exhaust(() => rl.checkLoginRateLimit({ ip: '1.1.1.1', email: 'a@x.com' }), 6);
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it('outage logs never contain the email in the key', async () => {
    upstash.override = async () => {
      throw new Error('down');
    };
    const rl = await load();
    await rl.checkLoginRateLimit({ ip: '1.1.1.1', email: 'secret@x.com' });
    const logged = JSON.stringify([captureMessage.mock.calls, vi.mocked(console.warn).mock.calls]);
    expect(logged).not.toContain('secret@x.com');
  });
});

describe('credential pairs (UPSTASH_REDIS_REST_* vs KV_REST_API_*)', () => {
  beforeEach(() => vi.stubEnv('NODE_ENV', 'production'));

  it('KV_REST_API_* alone enables Upstash with exactly that pair', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.upstash.io');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    const rl = await load();
    expect((await rl.checkInviteAcceptRateLimit('1.2.3.4')).success).toBe(true);
    expect(upstash.redisClients).toEqual([{ url: 'https://kv.upstash.io', token: 'kv-token' }]);
  });

  it('conflicting complete pairs: the UPSTASH pair is used intact, never mixed with KV', async () => {
    withUpstash();
    vi.stubEnv('KV_REST_API_URL', 'https://kv.upstash.io');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    const rl = await load();
    await rl.checkInviteAcceptRateLimit('1.2.3.4');
    expect(upstash.redisClients).toEqual([{ url: 'https://example.upstash.io', token: 'token' }]);
    expect(String(vi.mocked(console.warn).mock.calls)).not.toContain('kv-token');
  });

  it('cross-scheme halves (UPSTASH URL + KV token) fail closed instead of being combined', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    const rl = await load();
    expect(await rl.checkLoginRateLimit({ ip: '1.1.1.1', email: 'a@x.com' })).toMatchObject({
      success: false,
      reason: 'unavailable',
    });
    expect(upstash.redisClients).toHaveLength(0);
    const reported = String(captureMessage.mock.calls[0][0]);
    expect(reported).toMatch(/incomplete/);
    expect(reported).not.toContain('kv-token');
    expect(reported).not.toContain('example.upstash.io');
  });

  it('a half-set pair fails closed even when the other pair is complete', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.upstash.io');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    const rl = await load();
    expect((await rl.checkInviteAcceptRateLimit('1.2.3.4')).reason).toBe('unavailable');
    expect(upstash.redisClients).toHaveLength(0);
  });

  it('the read-only KV token is never used (fails closed)', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.upstash.io');
    vi.stubEnv('KV_REST_API_READ_ONLY_TOKEN', 'ro-token');
    const rl = await load();
    expect((await rl.checkInviteAcceptRateLimit('1.2.3.4')).reason).toBe('unavailable');
    expect(upstash.redisClients).toHaveLength(0);
  });

  it('dev/test: an incomplete pair disables limiting but warns', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('KV_REST_API_URL', 'https://kv.upstash.io');
    const rl = await load();
    expect((await rl.checkInviteAcceptRateLimit('1.2.3.4')).success).toBe(true);
    expect(String(vi.mocked(console.warn).mock.calls)).toMatch(/KV_REST_API_URL is set without KV_REST_API_TOKEN/);
  });
});

describe('without Upstash configured', () => {
  it('production: fails closed as unavailable and reports the misconfiguration once', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const rl = await load();
    const a = await rl.checkLoginRateLimit({ ip: '1.1.1.1', email: 'a@x.com' });
    const b = await rl.checkAttendanceCheckInRateLimit({ studentUserId: 'u', ip: '1.1.1.1' });
    expect(a).toMatchObject({ success: false, reason: 'unavailable' });
    expect(b).toMatchObject({ success: false, reason: 'unavailable' });
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(upstash.constructed).toHaveLength(0);
  });

  it('dev/test: disabled — every request is allowed', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const rl = await load();
    const results = await exhaust(() => rl.checkInviteAcceptRateLimit('1.2.3.4'), 20);
    expect(results.every(Boolean)).toBe(true);
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('importing the module in production never throws (build-safe)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(load()).resolves.toBeDefined();
    expect(captureMessage).not.toHaveBeenCalled();
  });
});

describe('rateLimitMessage', () => {
  it('is generic and distinguishes only throttling from unavailability', async () => {
    const rl = await load();
    expect(rl.rateLimitMessage('limited')).toMatch(/Too many attempts/);
    expect(rl.rateLimitMessage('unavailable')).toMatch(/temporarily unavailable/);
  });
});

describe('getClientIp', () => {
  const headers = (h: Record<string, string>) => new Headers(h);

  it('on Vercel, uses the platform-set x-real-ip', async () => {
    vi.stubEnv('VERCEL', '1');
    const rl = await load();
    expect(rl.getClientIp(headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' }))).toBe(
      '203.0.113.7'
    );
  });

  it('on Vercel, falls back to the first x-forwarded-for entry', async () => {
    vi.stubEnv('VERCEL', '1');
    const rl = await load();
    expect(rl.getClientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
  });

  it('off Vercel, ignores client-supplied (spoofable) IP headers', async () => {
    const rl = await load();
    expect(rl.getClientIp(headers({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' }))).toBe('unknown');
  });
});
