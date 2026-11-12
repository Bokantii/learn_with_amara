/**
 * Safety check for `prisma/seed.ts` (SPEC Known Deferred Issue #33e).
 *
 * The seed creates demo accounts with well-known passwords (e.g.
 * admin@iclp.com / admin1234) and fake academic/billing records, so it must
 * never run against the production database (CLAUDE.md §5, docs/LAUNCH_GATE.md
 * "never seed production").
 *
 * A NODE_ENV check alone is not enough: the realistic accident is running
 * `npx prisma db seed` on a laptop with a hosted connection string pasted into
 * the shell, where neither NODE_ENV nor VERCEL_ENV is set. So:
 *
 * - NODE_ENV / VERCEL_ENV = production → always refused.
 * - A local database (localhost / 127.0.0.1 / ::1) → allowed.
 * - Any other host → refused, unless SEED_ALLOW_REMOTE names that exact host
 *   (e.g. SEED_ALLOW_REMOTE=ep-xxxx.us-east-1.aws.neon.tech to seed the Preview
 *   database). Naming the host, rather than a blanket "true", means the opt-in
 *   cannot silently carry over to a different (production) connection string.
 * - Connection strings whose real host is set by a `host` / `hostaddr` query
 *   parameter are refused: the pg driver (pg-connection-string) lets those
 *   override the URL authority, so `postgresql://u:p@localhost/db?host=remote`
 *   would look local here but connect remotely.
 *
 * Returns a human-readable refusal reason, or null when seeding may proceed.
 * The reason never contains the connection string or its credentials.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const HOST_OVERRIDE_PARAMS = new Set(['host', 'hostaddr']);

export function seedRefusalReason(env: Record<string, string | undefined>): string | null {
  if (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production') {
    return 'Refusing to seed: this is a production environment (NODE_ENV or VERCEL_ENV is "production"). The seed creates demo accounts with public passwords and must never run against production.';
  }

  const url = env.DATABASE_URL?.trim();
  if (!url) {
    return 'Refusing to seed: DATABASE_URL is not set.';
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Refusing to seed: DATABASE_URL could not be parsed.';
  }

  for (const key of parsed.searchParams.keys()) {
    if (HOST_OVERRIDE_PARAMS.has(key.toLowerCase())) {
      return 'Refusing to seed: DATABASE_URL sets its host through a "host"/"hostaddr" query parameter, so the real target cannot be verified. Put the host in the URL itself.';
    }
  }

  const host = parsed.hostname.toLowerCase();
  if (!host) {
    return 'Refusing to seed: DATABASE_URL has no host, so the real target cannot be verified.';
  }

  if (LOCAL_HOSTS.has(host)) return null;

  const allowed = env.SEED_ALLOW_REMOTE?.trim().toLowerCase();
  if (allowed && allowed === host) return null;

  return 'Refusing to seed: DATABASE_URL points at a non-local database. The seed is meant for local development only. To deliberately seed a non-production database (e.g. the Preview database), re-run with SEED_ALLOW_REMOTE set to that database\'s exact hostname.';
}
