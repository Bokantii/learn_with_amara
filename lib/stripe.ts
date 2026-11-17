import Stripe from 'stripe';

// Falls back to an obviously-fake key so the app can build/run without
// STRIPE_SECRET_KEY configured — the Stripe SDK only validates the key
// against the API on an actual call, not at construction time. Any real
// checkout attempt will fail clearly (and safely) until a real key is set.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_not_configured', {
  apiVersion: '2026-07-29.dahlia',
  typescript: true,
});

/**
 * Whether a real secret key is configured — the same truthy-env-var check used
 * for the other optional integrations (`RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`).
 * Gates the public checkout flow: unconfigured, `/checkout` shows an honest
 * "contact us to enroll" notice instead of a payment form that would fail at
 * the Stripe API call (Launch Gate item 7 — payments default to manual-only).
 */
export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
