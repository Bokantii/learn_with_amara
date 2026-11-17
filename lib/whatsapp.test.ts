import { describe, it, expect } from 'vitest';
import { findProgrammeById, type Programme } from './programmes';
import {
  buildEnrollmentMessage,
  buildEnrollmentWhatsAppUrl,
  whatsappNumberForCurrency,
} from './whatsapp';

function programme(id: string): Programme {
  const found = findProgrammeById(id);
  if (!found) throw new Error(`missing programme ${id}`);
  return found;
}

describe('whatsappNumberForCurrency', () => {
  it('routes NGN to the Nigeria line and everything else to Canada', () => {
    expect(whatsappNumberForCurrency('NGN')).toBe('2348130408788');
    expect(whatsappNumberForCurrency('CAD')).toBe('14372918783');
    expect(whatsappNumberForCurrency('USD')).toBe('14372918783');
    expect(whatsappNumberForCurrency('GBP')).toBe('14372918783');
  });
});

describe('buildEnrollmentMessage', () => {
  it('names the package and its monthly price', () => {
    expect(buildEnrollmentMessage(programme('private-french-enthusiast-premier'), 'CAD')).toBe(
      'Hello, I want to buy the French Enthusiast Premier package ($60 CAD / month).'
    );
  });

  it('omits the monthly suffix for one-time programmes', () => {
    expect(buildEnrollmentMessage(programme('group-french-a0-a2'), 'NGN')).toBe(
      'Hello, I want to buy the A0–A2 Foundation French package (₦350,000).'
    );
  });
});

describe('buildEnrollmentWhatsAppUrl', () => {
  it('builds a wa.me link with the URL-encoded message', () => {
    const p = programme('group-tef-tcf-canada-prep');
    const url = new URL(buildEnrollmentWhatsAppUrl(p, 'USD'));
    expect(url.origin + url.pathname).toBe('https://wa.me/14372918783');
    expect(url.searchParams.get('text')).toBe(buildEnrollmentMessage(p, 'USD'));
  });

  it('uses the Nigeria line for naira prices', () => {
    const url = buildEnrollmentWhatsAppUrl(programme('private-french-enthusiast-premier'), 'NGN');
    expect(url.startsWith('https://wa.me/2348130408788?text=')).toBe(true);
  });
});
