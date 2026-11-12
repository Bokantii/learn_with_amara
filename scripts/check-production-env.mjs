// Fails the production Vercel build when configuration that protects users is
// missing, instead of deploying an app that would silently run without it.
// Run from `vercel-build` only when VERCEL_ENV=production. Prints variable
// names only — never values.

import { pathToFileURL } from 'node:url';
import { resolveUpstashCredentials } from '../lib/upstash-credentials.mjs';

/**
 * Problems that must block a production build:
 * - Rate limiting on sign-in, sign-up, password reset, invites and QR check-in
 *   needs a complete Upstash URL + token pair from one naming scheme
 *   (lib/rate-limit.ts fails closed without it in production).
 * - NEXT_PUBLIC_APP_URL must be a bare https origin (lib/app-url.ts never
 *   trusts forwarded headers in production).
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function productionEnvProblems(env = process.env) {
  return [...upstashProblems(env), ...appUrlProblems(env)];
}

/** @param {Record<string, string | undefined>} env */
function upstashProblems(env) {
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
 * NEXT_PUBLIC_APP_URL is the only trusted source of the public origin in
 * production (lib/app-url.ts): emailed invite/reset/welcome links, the
 * attendance QR and Stripe redirects are built from it, never from request
 * headers. It must be a bare https origin (no path), e.g. https://iclanguages.com.
 *
 * @param {Record<string, string | undefined>} env
 */
function appUrlProblems(env) {
  const raw = env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    return ['NEXT_PUBLIC_APP_URL is missing: set it to the public https origin, e.g. https://iclanguages.com'];
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    return ['NEXT_PUBLIC_APP_URL is not a valid URL: set it to the public https origin, e.g. https://iclanguages.com'];
  }
  if (url.protocol !== 'https:' || url.origin !== raw.replace(/\/+$/, '')) {
    return ['NEXT_PUBLIC_APP_URL must be a bare https origin with no path, query or credentials, e.g. https://iclanguages.com'];
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
