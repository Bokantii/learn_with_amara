// Fails the production Vercel build when configuration that protects users is
// missing, instead of deploying an app that would silently run without it.
// Run from `vercel-build` only when VERCEL_ENV=production. Prints variable
// names only — never values.

import { pathToFileURL } from 'node:url';
import { resolveUpstashCredentials } from '../lib/upstash-credentials.mjs';

/**
 * Problems that must block a production build. Rate limiting on sign-in,
 * sign-up, password reset, invites and QR check-in needs a complete Upstash
 * URL + token pair from one naming scheme (lib/rate-limit.ts fails closed
 * without it in production).
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function productionEnvProblems(env = process.env) {
  const upstash = resolveUpstashCredentials(env);
  if (upstash.status === 'missing') {
    return [
      'Upstash Redis credentials are missing: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or KV_REST_API_URL + KV_REST_API_TOKEN',
    ];
  }
  if (upstash.status === 'incomplete') {
    return upstash.problems.map((p) => `Upstash Redis credentials are incomplete: ${p}`);
  }
  return [];
}

/**
 * Non-blocking notices (names only).
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function productionEnvWarnings(env = process.env) {
  const upstash = resolveUpstashCredentials(env);
  if (upstash.status === 'ok' && upstash.conflict) {
    return [
      'Both UPSTASH_REDIS_REST_* and KV_REST_API_* are set with different values; using UPSTASH_REDIS_REST_*. Remove the unused pair to avoid confusion.',
    ];
  }
  return [];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const warning of productionEnvWarnings()) console.warn(`[check-production-env] Warning: ${warning}`);
  const problems = productionEnvProblems();
  if (problems.length > 0) {
    console.error(
      `[check-production-env] Production configuration is not safe to deploy:\n` +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\nFix them in Vercel → Project → Settings → Environment Variables (Production) and redeploy.'
    );
    process.exit(1);
  }
  console.log('[check-production-env] Required production environment variables are set.');
}
