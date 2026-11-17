import { describe, it, expect } from 'vitest';
import { resolveUpstashCredentials } from './upstash-credentials.mjs';

const UPSTASH = { UPSTASH_REDIS_REST_URL: 'https://a.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'token-a' };
const KV = { KV_REST_API_URL: 'https://b.upstash.io', KV_REST_API_TOKEN: 'token-b' };

describe('resolveUpstashCredentials', () => {
  it('nothing set → missing', () => {
    expect(resolveUpstashCredentials({})).toEqual({ status: 'missing' });
  });

  it('blank values count as unset', () => {
    expect(resolveUpstashCredentials({ UPSTASH_REDIS_REST_URL: '  ', KV_REST_API_TOKEN: '' })).toEqual({
      status: 'missing',
    });
  });

  it('a complete UPSTASH_REDIS_REST_* pair', () => {
    expect(resolveUpstashCredentials(UPSTASH)).toEqual({
      status: 'ok',
      source: 'UPSTASH_REDIS_REST',
      url: 'https://a.upstash.io',
      token: 'token-a',
      conflict: false,
    });
  });

  it('a complete KV_REST_API_* pair (Vercel Marketplace naming)', () => {
    expect(resolveUpstashCredentials(KV)).toEqual({
      status: 'ok',
      source: 'KV_REST_API',
      url: 'https://b.upstash.io',
      token: 'token-b',
      conflict: false,
    });
  });

  it('both complete and different → UPSTASH pair wins intact, conflict flagged, never mixed', () => {
    const result = resolveUpstashCredentials({ ...UPSTASH, ...KV });
    expect(result).toEqual({
      status: 'ok',
      source: 'UPSTASH_REDIS_REST',
      url: 'https://a.upstash.io',
      token: 'token-a',
      conflict: true,
    });
  });

  it('both complete and identical → no conflict', () => {
    const same = { KV_REST_API_URL: UPSTASH.UPSTASH_REDIS_REST_URL, KV_REST_API_TOKEN: UPSTASH.UPSTASH_REDIS_REST_TOKEN };
    expect(resolveUpstashCredentials({ ...UPSTASH, ...same })).toMatchObject({ status: 'ok', conflict: false });
  });

  it.each([
    [{ UPSTASH_REDIS_REST_URL: 'https://a.upstash.io' }, 'UPSTASH_REDIS_REST_URL is set without UPSTASH_REDIS_REST_TOKEN'],
    [{ UPSTASH_REDIS_REST_TOKEN: 'token-a' }, 'UPSTASH_REDIS_REST_TOKEN is set without UPSTASH_REDIS_REST_URL'],
    [{ KV_REST_API_URL: 'https://b.upstash.io' }, 'KV_REST_API_URL is set without KV_REST_API_TOKEN'],
    [{ KV_REST_API_TOKEN: 'token-b' }, 'KV_REST_API_TOKEN is set without KV_REST_API_URL'],
  ])('a half-set pair is incomplete: %o', (env, problem) => {
    expect(resolveUpstashCredentials(env)).toEqual({ status: 'incomplete', problems: [problem] });
  });

  it('cross-scheme halves (UPSTASH URL + KV token) are NOT combined', () => {
    const result = resolveUpstashCredentials({
      UPSTASH_REDIS_REST_URL: 'https://a.upstash.io',
      KV_REST_API_TOKEN: 'token-b',
    });
    expect(result.status).toBe('incomplete');
    expect(result).not.toHaveProperty('url');
  });

  it('a half-set pair is an error even when the other pair is complete (ambiguous intent)', () => {
    const result = resolveUpstashCredentials({ ...KV, UPSTASH_REDIS_REST_URL: 'https://a.upstash.io' });
    expect(result).toEqual({
      status: 'incomplete',
      problems: ['UPSTASH_REDIS_REST_URL is set without UPSTASH_REDIS_REST_TOKEN'],
    });
  });

  it('never uses the read-only KV token (the limiter writes)', () => {
    const result = resolveUpstashCredentials({
      KV_REST_API_URL: 'https://b.upstash.io',
      KV_REST_API_READ_ONLY_TOKEN: 'read-only',
    });
    expect(result).toEqual({ status: 'incomplete', problems: ['KV_REST_API_URL is set without KV_REST_API_TOKEN'] });
  });

  it('problems name variables only, never values', () => {
    const result = resolveUpstashCredentials({ UPSTASH_REDIS_REST_URL: 'https://secret-host.upstash.io' });
    expect(JSON.stringify(result)).not.toContain('secret-host');
  });
});
