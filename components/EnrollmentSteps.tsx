import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { getOfficialPaymentDestinations } from '../lib/payment-details';
import { CANADA_WHATSAPP_DISPLAY, NIGERIA_WHATSAPP_DISPLAY } from '../lib/whatsapp';

/**
 * Official payment destinations, rendered only for entries with real details
 * (see lib/payment-details.ts). Renders nothing when none are published.
 */
export function OfficialPaymentAccounts({ compact = false }: { compact?: boolean }) {
  const destinations = getOfficialPaymentDestinations();
  if (destinations.length === 0) return null;

  return (
    <section aria-labelledby="official-payment-accounts" className="space-y-3 text-left">
      <h3 id="official-payment-accounts" className="text-lg">
        Official payment accounts
      </h3>
      <p className="text-sm text-muted-foreground">
        Only pay to the accounts below. If anyone sends you different details, don&apos;t pay —
        message us on one of our official numbers first.
      </p>
      <div className={compact ? 'grid gap-4' : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
        {destinations.map((d) => (
          <div key={d.id} className="rounded-lg border-2 bg-white p-4 space-y-2">
            <div>
              <p className="font-medium text-foreground">{d.method}</p>
              <p className="text-xs text-muted-foreground">{d.region}</p>
            </div>
            <dl className="text-sm space-y-1">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-foreground break-words">{d.accountName}</dd>
              </div>
              {d.details.map((line) => (
                <div key={line.label}>
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="text-foreground break-words">{line.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * How WhatsApp enrollment works, shown while online checkout isn't available.
 * Sets expectations for each step and tells students how to spot impersonators.
 */
export function EnrollmentSteps() {
  const hasPublishedAccounts = getOfficialPaymentDestinations().length > 0;
  const steps = [
    'Tap “Enroll via WhatsApp” on your programme — your package and price are filled in for you.',
    'Our admissions team replies to confirm your schedule and send payment instructions.',
    hasPublishedAccounts
      ? 'Pay only to one of the official accounts listed on this page.'
      : 'Pay using the instructions admissions sends you, and keep your transfer reference.',
    'We email you a receipt and your student login. The payment also appears under Billing in your dashboard.',
  ];

  return (
    <Card className="border-2 bg-slate-50/60">
      <CardHeader className="p-6 pb-2">
        <h2 className="text-2xl">How enrollment works</h2>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-6">
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span>
                <span className="sr-only">Step {index + 1}: </span>
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <ShieldCheck className="h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
          <p>
            We only message from <strong className="whitespace-nowrap">{CANADA_WHATSAPP_DISPLAY}</strong> (Canada) and{' '}
            <strong className="whitespace-nowrap">{NIGERIA_WHATSAPP_DISPLAY}</strong> (Nigeria). We will never ask for card
            numbers, passwords or one-time codes in chat.
          </p>
        </div>

        <OfficialPaymentAccounts />
      </CardContent>
    </Card>
  );
}
