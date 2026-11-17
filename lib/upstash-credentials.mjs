// Resolves Upstash Redis REST credentials for the rate limiter (lib/rate-limit.ts)
// and the production build gate (scripts/check-production-env.mjs), so both apply
// the same rule. Plain .mjs so the build script can import it without a compiler.
//
// Two naming schemes exist: UPSTASH_REDIS_REST_* (Upstash console) and
// KV_REST_API_* (what Vercel's Upstash Marketplace integration may inject).
// Credentials are only ever taken as a complete URL + token pair from ONE
// scheme, never mixed, because a URL from one database with a token from
// another fails in confusing ways. Rules:
//   - a half-set pair in either scheme is a configuration error, even if the
//     other scheme is complete (the intent is ambiguous);
//   - if both pairs are complete, UPSTASH_REDIS_REST_* wins (same precedence as
//     the Upstash SDK's Redis.fromEnv) and `conflict` flags differing values;
//   - KV_REST_API_READ_ONLY_TOKEN is never used: the limiter writes.
// Results carry variable names only; callers must never log the values.

const SCHEMES = [
  { source: 'UPSTASH_REDIS_REST', url: 'UPSTASH_REDIS_REST_URL', token: 'UPSTASH_REDIS_REST_TOKEN' },
  { source: 'KV_REST_API', url: 'KV_REST_API_URL', token: 'KV_REST_API_TOKEN' },
];

/**
 * @typedef {{ status: 'ok', source: 'UPSTASH_REDIS_REST' | 'KV_REST_API', url: string, token: string, conflict: boolean }
 *   | { status: 'missing' }
 *   | { status: 'incomplete', problems: string[] }} UpstashCredentials
 */

/**
 * @param {Record<string, string | undefined>} env
 * @returns {UpstashCredentials}
 */
export function resolveUpstashCredentials(env) {
  /** @param {string} name */
  const read = (name) => env[name]?.trim() || '';

  const pairs = SCHEMES.map((s) => ({ ...s, urlValue: read(s.url), tokenValue: read(s.token) }));

  const problems = [];
  for (const p of pairs) {
    if (p.urlValue && !p.tokenValue) problems.push(`${p.url} is set without ${p.token}`);
    if (!p.urlValue && p.tokenValue) problems.push(`${p.token} is set without ${p.url}`);
  }
  if (problems.length > 0) return { status: 'incomplete', problems };

  const complete = pairs.filter((p) => p.urlValue && p.tokenValue);
  if (complete.length === 0) return { status: 'missing' };

  const [chosen, other] = complete;
  return {
    status: 'ok',
    source: /** @type {'UPSTASH_REDIS_REST' | 'KV_REST_API'} */ (chosen.source),
    url: chosen.urlValue,
    token: chosen.tokenValue,
    conflict: Boolean(other && (other.urlValue !== chosen.urlValue || other.tokenValue !== chosen.tokenValue)),
  };
}
