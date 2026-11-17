/**
 * Shared Sentry settings for the server, edge and browser configs.
 * - `environment` tags each event production / preview / development, so
 *   errors found while testing on Preview stay apart from real ones.
 * - Performance tracing samples 10% of requests in production to stay
 *   within the plan's quota; errors are always captured in full.
 * `vercelEnv` is VERCEL_ENV on the server and NEXT_PUBLIC_VERCEL_ENV in the
 * browser (Vercel exposes both by default); unset locally → "development".
 */
export function sentryOptions(vercelEnv: string | undefined) {
  const environment = vercelEnv || 'development';
  return {
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  };
}
