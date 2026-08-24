import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; currency?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/SignIn');
  }

  const { planId, currency } = await searchParams;

  return <CheckoutClient planId={planId} currency={currency} />;
}
