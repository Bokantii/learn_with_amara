import { describe, it, expect } from 'vitest';
import { formatMoney } from './format';

describe('formatMoney', () => {
  it('formats USD / CAD with 2 decimals and a disambiguating suffix', () => {
    expect(formatMoney(30000, 'usd')).toBe('$300.00 USD');
    expect(formatMoney(30000, 'cad')).toBe('$300.00 CAD');
    expect(formatMoney(12345, 'cad')).toBe('$123.45 CAD');
  });

  it('formats GBP with the £ glyph and no suffix', () => {
    expect(formatMoney(18900, 'gbp')).toBe('£189.00');
  });

  it('formats NGN with 2 decimals (NGN has kobo — not a zero-decimal currency)', () => {
    expect(formatMoney(35000000, 'ngn')).toBe('₦350,000.00');
    expect(formatMoney(35000050, 'ngn')).toBe('₦350,000.50');
  });

  it('formats a genuinely zero-decimal currency with no fractional part', () => {
    expect(formatMoney(500000, 'jpy')).toBe('¥5,000');
  });

  it('handles zero', () => {
    expect(formatMoney(0, 'cad')).toBe('$0.00 CAD');
  });

  it('falls back to an ISO-code suffix for an unknown currency', () => {
    expect(formatMoney(5000, 'chf')).toBe('50.00 CHF');
  });

  it('is case-insensitive on the currency code', () => {
    expect(formatMoney(10000, 'USD')).toBe('$100.00 USD');
  });
});
