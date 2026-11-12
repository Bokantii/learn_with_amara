import { describe, it, expect } from 'vitest';
import { productionEnvProblems, productionEnvWarnings } from '../scripts/check-production-env.mjs';

// A valid public origin, so the Upstash cases below test only the Upstash rule.
const APP = { NEXT_PUBLIC_APP_URL: 'https://iclanguages.com' };

describe('check-production-env (production Vercel build gate)', () => {
  it('blocks when no Upstash credentials are set (blank counts as unset)', () => {
    const problems = productionEnvProblems({ ...APP, UPSTASH_REDIS_REST_URL: '  ' });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/missing/);
  });

  it('passes with the UPSTASH_REDIS_REST_* pair', () => {
    expect(
      productionEnvProblems({ ...APP, UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' })
    ).toEqual([]);
  });

  it('passes with the KV_REST_API_* pair (Vercel Marketplace naming)', () => {
    expect(productionEnvProblems({ ...APP, KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' })).toEqual([]);
  });

  it('blocks a cross-scheme mix (UPSTASH URL + KV token) instead of combining it', () => {
    const problems = productionEnvProblems({ ...APP, UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' });
    expect(problems).toEqual([
      'Upstash Redis credentials are incomplete: UPSTASH_REDIS_REST_URL is set without UPSTASH_REDIS_REST_TOKEN',
      'Upstash Redis credentials are incomplete: KV_REST_API_TOKEN is set without KV_REST_API_URL',
    ]);
  });

  it('blocks a half-set pair even when the other pair is complete', () => {
    expect(
      productionEnvProblems({
        ...APP,
        KV_REST_API_URL: 'https://x.upstash.io',
        KV_REST_API_TOKEN: 't',
        UPSTASH_REDIS_REST_TOKEN: 'other',
      })
    ).toHaveLength(1);
  });

  it('two complete, differing pairs pass with a warning (no values printed)', () => {
    const env = {
      ...APP,
      UPSTASH_REDIS_REST_URL: 'https://a-secret.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'a',
      KV_REST_API_URL: 'https://b-secret.upstash.io',
      KV_REST_API_TOKEN: 'b',
    };
    expect(productionEnvProblems(env)).toEqual([]);
    const warnings = productionEnvWarnings(env);
    expect(warnings).toHaveLength(1);
    expect(warnings.join()).not.toMatch(/secret/);
  });

  it('blocks a missing, blank or invalid NEXT_PUBLIC_APP_URL (names only, no values)', () => {
    const upstash = { KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' };
    expect(productionEnvProblems(upstash)).toEqual([
      'NEXT_PUBLIC_APP_URL is missing: set it to the public https origin, e.g. https://iclanguages.com',
    ]);
    expect(productionEnvProblems({ ...upstash, NEXT_PUBLIC_APP_URL: '  ' })[0]).toMatch(/missing/);
    expect(productionEnvProblems({ ...upstash, NEXT_PUBLIC_APP_URL: 'iclanguages.com' })[0]).toMatch(/not a valid URL/);
    for (const bad of [
      'http://iclanguages.com',
      'https://iclanguages.com/app',
      'https://iclanguages.com?x=1',
      'https://user:pw@iclanguages.com',
    ]) {
      const problems = productionEnvProblems({ ...upstash, NEXT_PUBLIC_APP_URL: bad });
      expect(problems, bad).toHaveLength(1);
      expect(problems[0]).toMatch(/bare https origin/);
      expect(problems[0]).not.toContain('pw@');
    }
  });

  it('accepts a bare https origin, with or without a trailing slash', () => {
    const upstash = { KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' };
    expect(productionEnvProblems({ ...upstash, NEXT_PUBLIC_APP_URL: 'https://iclanguages.com' })).toEqual([]);
    expect(productionEnvProblems({ ...upstash, NEXT_PUBLIC_APP_URL: 'https://iclanguages.com/' })).toEqual([]);
  });

  it('reports Upstash and app-URL problems together', () => {
    expect(productionEnvProblems({})).toHaveLength(2);
  });
});
