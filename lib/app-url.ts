import { headers } from 'next/headers';

/**
 * Absolute origin (`https://host`) for building links that leave the app and
 * come back — e.g. the attendance QR, which a phone camera opens as a bare URL.
 *
 * Prefers an explicit `NEXT_PUBLIC_APP_URL` (set this behind a proxy / CDN
 * where the forwarded headers can't be trusted); otherwise derives it from the
 * incoming request's forwarded host/proto. Must be called from a request scope
 * (server action / route handler / RSC).
 */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  // In production the forwarded host is attacker-influenceable behind a
  // misconfigured proxy, which would let the attendance QR point students at a
  // phishing origin. Require the explicit value there; only derive it in dev.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL must be set in production (used to build the attendance check-in URL).');
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) {
    throw new Error('Cannot determine the app origin: no host header and NEXT_PUBLIC_APP_URL is unset.');
  }
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
