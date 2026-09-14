import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../../lib/stripe';
import { prisma } from '../../../../lib/prisma';
import { resend, EMAIL_FROM } from '../../../../lib/email';
import PaymentReceiptEmail from '../../../../emails/PaymentReceiptEmail';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret.' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature.';
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id ?? session.metadata?.userId;
    const amountCents = session.amount_total ?? 0;

    // Only act on a paid session that carries a real user reference and a real
    // amount. Anything else is acknowledged (200) so Stripe stops retrying —
    // a missing/typo'd user or a zero total must not create a bogus PAID row.
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
      : null;

    if (user && amountCents > 0 && session.payment_status === 'paid') {
      const existing = await prisma.payment.findUnique({
        where: { stripePaymentId: session.id },
      });

      if (!existing) {
        // A processor-confirmed payment. `programId` / `enrollmentId` stay null:
        // the checkout plan id is a pricing-catalogue id, not a DB Program, so
        // the program can't be resolved here (see Known Deferred Issues). An
        // admin links it on the Payments screen if needed.
        let payment;
        try {
          payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amountCents,
              currency: session.currency ?? 'usd',
              status: 'PAID',
              source: 'STRIPE',
              stripePaymentId: session.id,
              paidAt: new Date(),
            },
            include: { user: true },
          });
        } catch (error) {
          // A concurrent delivery of the same event lost the create race — the
          // unique `stripePaymentId` already exists. Treat as success.
          if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
            return NextResponse.json({ received: true });
          }
          throw error;
        }

        try {
          const { error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: payment.user.email,
            subject: 'Your ICLP payment receipt',
            react: PaymentReceiptEmail({
              name: payment.user.name,
              amountFormatted: `$${(payment.amountCents / 100).toFixed(2)}`,
              date: payment.paidAt?.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }) ?? '',
              receiptId: payment.id,
            }),
          });
          if (error) {
            console.error('Failed to send payment receipt email:', error);
          }
        } catch (error) {
          console.error('Failed to send payment receipt email:', error);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
