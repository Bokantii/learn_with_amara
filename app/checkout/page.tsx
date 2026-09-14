import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '../../lib/authz';
import { isStripeConfigured } from '../../lib/stripe';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; currency?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/SignIn');
  }

  const { planId, currency } = await searchParams;

  // Online payment is only offered once Stripe is genuinely configured
  // (Launch Gate item 7). Until then, enrollment is admin-recorded — show
  // that honestly instead of a payment form that would fail at the Stripe API
  // call.
  if (!isStripeConfigured) {
    return (
      <div className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-lg mx-auto">
            <Card className="border-2">
              <CardHeader className="p-6 space-y-2 text-center">
                <h1 className="text-2xl">Enrollment</h1>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6 text-center">
                <p className="text-muted-foreground">
                  Online payment isn&apos;t available yet. Contact us and our admissions team
                  will set up your enrollment and payment directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/Pricing">Back to Pricing</Link>
                  </Button>
                  <Button asChild>
                    <a href="mailto:centerforlanguageproficiency@gmail.com">Email us to enroll</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <CheckoutClient planId={planId} currency={currency} />;
}
