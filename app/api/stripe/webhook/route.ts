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

    if (userId && session.payment_status === 'paid') {
      const existing = await prisma.payment.findUnique({
        where: { stripePaymentId: session.id },
      });

      if (!existing) {
        const payment = await prisma.payment.create({
          data: {
            userId,
            amountCents: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
            status: 'PAID',
            stripePaymentId: session.id,
            dueDate: new Date(),
            paidAt: new Date(),
          },
          include: { user: true },
        });

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
