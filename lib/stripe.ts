import Stripe from 'stripe';

// Falls back to an obviously-fake key so the app can build/run without
// STRIPE_SECRET_KEY configured — the Stripe SDK only validates the key
// against the API on an actual call, not at construction time. Any real
// checkout attempt will fail clearly (and safely) until a real key is set.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_not_configured', {
  apiVersion: '2026-07-29.dahlia',
  typescript: true,
});
