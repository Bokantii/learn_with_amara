/**
 * The single definition of the student check-in route + how the raw token rides
 * on it. Shared by the QR builder (admin start action) and the sign-in
 * callback-URL round trip. Pure — no I/O.
 */

export const CHECK_IN_PATH = '/attendance/checkin';

/** Relative path + token query — used for the sign-in `callbackUrl`. */
export function buildCheckInPath(rawToken: string): string {
  return `${CHECK_IN_PATH}?token=${encodeURIComponent(rawToken)}`;
}

/** Absolute URL for the QR code. `origin` must be a bare scheme+host, no trailing slash. */
export function buildCheckInUrl(origin: string, rawToken: string): string {
  return `${origin}${buildCheckInPath(rawToken)}`;
}
