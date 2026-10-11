import { formatPrice, type Currency, type Programme } from './programmes';

// ICLP's admissions WhatsApp lines, in wa.me format (country code, digits only).
const CANADA_WHATSAPP_NUMBER = '14372918783';
const NIGERIA_WHATSAPP_NUMBER = '2348130408788';

export const CANADA_WHATSAPP_URL = `https://wa.me/${CANADA_WHATSAPP_NUMBER}`;
export const NIGERIA_WHATSAPP_URL = `https://wa.me/${NIGERIA_WHATSAPP_NUMBER}`;

/** Human-readable forms, for "we only ever message from these numbers" copy. */
export const CANADA_WHATSAPP_DISPLAY = '+1 437 291 8783';
export const NIGERIA_WHATSAPP_DISPLAY = '+234 813 040 8788';

/** Naira prices are handled by the Nigeria line; every other currency by Canada. */
export function whatsappNumberForCurrency(currency: Currency): string {
  return currency === 'NGN' ? NIGERIA_WHATSAPP_NUMBER : CANADA_WHATSAPP_NUMBER;
}

export function buildEnrollmentMessage(programme: Programme, currency: Currency): string {
  const price = formatPrice(currency, programme.prices[currency]);
  const period = programme.billingPeriod === 'month' ? ' / month' : '';
  return `Hello, I want to buy the ${programme.name} package (${price}${period}).`;
}

/**
 * Pre-filled WhatsApp chat for enrolling in a programme. Used as the enrollment
 * path while online payment (Stripe) isn't configured — admissions arranges
 * payment in the chat and an admin records the enrollment.
 */
export function buildEnrollmentWhatsAppUrl(programme: Programme, currency: Currency): string {
  const text = encodeURIComponent(buildEnrollmentMessage(programme, currency));
  return `https://wa.me/${whatsappNumberForCurrency(currency)}?text=${text}`;
}
