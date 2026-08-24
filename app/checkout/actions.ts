'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authActionClient } from '../../lib/safe-action';
import { stripe } from '../../lib/stripe';
import { translations } from '../../lib/i18n/translations';
import { PLAN_PRICES_CENTS, DEFAULT_PLAN_ID } from '../../lib/pricing';
import { findProgrammeById } from '../../lib/programmes';

const createCheckoutSessionSchema = z.object({
  planId: z.string().min(1),
  currency: z.enum(['CAD', 'NGN', 'USD', 'GBP']).optional(),
});

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}

export const createCheckoutSessionAction = authActionClient
  .schema(createCheckoutSessionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const programme = findProgrammeById(parsedInput.planId);

    let planId: string;
    let currency: string;
    let unitAmount: number;
    let name: string;
    let description: string | undefined;

    if (programme) {
      const selectedCurrency = parsedInput.currency ?? 'CAD';
      planId = programme.id;
      currency = selectedCurrency.toLowerCase();
      unitAmount = Math.round(programme.prices[selectedCurrency] * 100);
      name = programme.name;
      description = `${programme.frequency} · ${programme.isMinimumDuration ? 'Minimum ' : ''}${programme.duration}`;
    } else {
      planId = parsedInput.planId in PLAN_PRICES_CENTS ? parsedInput.planId : DEFAULT_PLAN_ID;
      currency = 'usd';
      unitAmount = PLAN_PRICES_CENTS[planId];
      const tier = translations.EN.pricingSection.tiers.find((t) => t.id === planId);
      name = tier?.name ?? 'ICLP Program';
      description = tier?.description;
    }

    const origin = await getOrigin();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: ctx.userId,
      metadata: { planId, userId: ctx.userId, currency },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name,
              description,
            },
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?planId=${planId}`,
    });

    if (!checkoutSession.url) {
      throw new Error('Could not start checkout. Please try again.');
    }

    redirect(checkoutSession.url);
  });
