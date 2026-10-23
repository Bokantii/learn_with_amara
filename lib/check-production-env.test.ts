import { describe, it, expect } from 'vitest';
import { productionEnvProblems, productionEnvWarnings } from '../scripts/check-production-env.mjs';

describe('check-production-env (production Vercel build gate)', () => {
  it('blocks when no Upstash credentials are set (blank counts as unset)', () => {
    const problems = productionEnvProblems({ UPSTASH_REDIS_REST_URL: '  ' });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/missing/);
  });

  it('passes with the UPSTASH_REDIS_REST_* pair', () => {
    expect(
      productionEnvProblems({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' })
    ).toEqual([]);
  });

  it('passes with the KV_REST_API_* pair (Vercel Marketplace naming)', () => {
    expect(productionEnvProblems({ KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' })).toEqual([]);
  });

  it('blocks a cross-scheme mix (UPSTASH URL + KV token) instead of combining it', () => {
    const problems = productionEnvProblems({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' });
    expect(problems).toEqual([
      'Upstash Redis credentials are incomplete: UPSTASH_REDIS_REST_URL is set without UPSTASH_REDIS_REST_TOKEN',
      'Upstash Redis credentials are incomplete: KV_REST_API_TOKEN is set without KV_REST_API_URL',
    ]);
  });

  it('blocks a half-set pair even when the other pair is complete', () => {
    expect(
      productionEnvProblems({
        KV_REST_API_URL: 'https://x.upstash.io',
        KV_REST_API_TOKEN: 't',
        UPSTASH_REDIS_REST_TOKEN: 'other',
      })
    ).toHaveLength(1);
  });

  it('two complete, differing pairs pass with a warning (no values printed)', () => {
    const env = {
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
});
