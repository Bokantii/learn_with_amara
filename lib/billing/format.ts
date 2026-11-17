/**
 * Money formatting for real payment records. `Payment.amountCents` is an integer
 * count of the currency's minor unit; `Payment.currency` is a lowercase ISO code
 * (Stripe convention). Genuinely zero-decimal currencies (JPY, KRW, …) are shown
 * without a fractional part; everything else — including NGN, which has kobo — is
 * shown with 2 decimals.
 */

const SYMBOLS: Record<string, string> = {
  usd: '$',
  cad: '$',
  gbp: '£',
  ngn: '₦',
  eur: '€',
  jpy: '¥',
};

// Currencies that share the "$" glyph get a disambiguating suffix.
const SUFFIX: Record<string, string> = {
  usd: 'USD',
  cad: 'CAD',
};

const ZERO_DECIMAL = new Set(['jpy', 'krw', 'vnd', 'xof', 'xaf', 'clp']);

export function formatMoney(amountCents: number, currency: string): string {
  const code = (currency || 'usd').toLowerCase();
  const symbol = SYMBOLS[code] ?? '';
  const suffix = SUFFIX[code] ?? (symbol ? '' : code.toUpperCase());

  const major = ZERO_DECIMAL.has(code)
    ? Math.round(amountCents / 100).toLocaleString('en-US')
    : (amountCents / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return `${symbol}${major}${suffix ? ` ${suffix}` : ''}`.trim();
}
