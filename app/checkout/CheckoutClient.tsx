"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Check, ShieldCheck, Lock } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { translations } from "../../lib/i18n/translations";
import { findProgrammeById, formatPrice, CURRENCIES, type Currency } from "../../lib/programmes";
import { createCheckoutSessionAction } from "./actions";

interface OrderSummary {
  id: string;
  name: string;
  description: string;
  features: string[];
  priceLabel: string;
  periodLabel: string;
}

export default function CheckoutClient({
  planId,
  currency,
}: {
  planId?: string;
  currency?: string;
}) {
  const { language } = useLanguage();
  const selectedCurrency: Currency = (CURRENCIES as string[]).includes(currency ?? "")
    ? (currency as Currency)
    : "CAD";

  const programme = planId ? findProgrammeById(planId) : undefined;

  let order: OrderSummary;
  if (programme) {
    order = {
      id: programme.id,
      name: programme.name,
      description: `${programme.frequency} · ${programme.isMinimumDuration ? "Minimum " : ""}${programme.duration}`,
      features: [
        programme.frequency,
        programme.isMinimumDuration ? `Minimum ${programme.duration}` : programme.duration,
        ...(programme.sessionLength ? [`${programme.sessionLength} per session`] : []),
      ],
      priceLabel: formatPrice(selectedCurrency, programme.prices[selectedCurrency]),
      periodLabel: programme.billingPeriod === "month" ? " / month" : " (paid once)",
    };
  } else {
    const tiers = translations[language].pricingSection.tiers;
    const tier = tiers.find((t) => t.id === planId) ?? tiers[0];
    order = {
      id: tier.id,
      name: tier.name,
      description: tier.description,
      features: tier.features,
      priceLabel: tier.price,
      periodLabel: tier.period,
    };
  }

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        planId: order.id,
        currency: programme ? selectedCurrency : undefined,
      });
      // A successful call redirects server-side and never returns here.
      if (result?.serverError) {
        setError(result.serverError);
      }
    });
  };

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl lg:text-5xl mb-4">Checkout</h1>
          <p className="text-lg text-muted-foreground">
            You'll be redirected to Stripe's secure checkout to complete your payment.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="border-2 bg-slate-50">
            <CardHeader className="p-6 space-y-2">
              <h2 className="text-xl">Order Summary</h2>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg">{order.name}</h3>
                <p className="text-sm text-muted-foreground">{order.description}</p>
              </div>
              <ul className="space-y-2">
                {order.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-border flex items-baseline justify-between">
                <span className="text-muted-foreground">Total</span>
                <div>
                  <span className="text-3xl text-primary">{order.priceLabel}</span>
                  <span className="text-muted-foreground">{order.periodLabel}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                className="w-full h-12 bg-accent hover:bg-accent/90"
                onClick={handleCheckout}
                disabled={isPending}
              >
                <Lock className="w-4 h-4 mr-2" />
                {isPending ? "Redirecting to Stripe..." : "Proceed to Secure Checkout"}
              </Button>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                Payments are processed securely by Stripe — we never see your card details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
