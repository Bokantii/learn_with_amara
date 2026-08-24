import Link from 'next/link';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Check, XCircle } from 'lucide-react';
import { stripe } from '../../../lib/stripe';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let isPaid = false;
  let amountTotal: number | null = null;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      isPaid = session.payment_status === 'paid';
      amountTotal = session.amount_total;
    } catch {
      isPaid = false;
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <Card className="max-w-md mx-auto border-2 text-center">
          <CardContent className="p-8 lg:p-12 space-y-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                isPaid ? 'bg-primary/10' : 'bg-destructive/10'
              }`}
            >
              {isPaid ? (
                <Check className="w-8 h-8 text-primary" />
              ) : (
                <XCircle className="w-8 h-8 text-destructive" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl">{isPaid ? "You're all set!" : 'Payment not confirmed'}</h2>
              <p className="text-muted-foreground">
                {isPaid
                  ? `Your payment${
                      amountTotal ? ` of $${(amountTotal / 100).toFixed(2)}` : ''
                    } was successful. A confirmation email is on its way.`
                  : "We couldn't confirm this payment. If you were charged, contact support and we'll sort it out."}
              </p>
            </div>
            <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
