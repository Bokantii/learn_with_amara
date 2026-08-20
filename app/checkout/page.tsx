'use client';
import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { translations } from '../../lib/i18n/translations';

interface CheckoutProps {
  onNavigate: (page: string, planId?: string) => void;
  planId?: string;
}

export default function Checkout({ onNavigate = () => {}, planId }: Partial<CheckoutProps>) {
  const { language } = useLanguage();
  const tiers = translations[language].pricingSection.tiers;
  const tier = tiers.find((t) => t.id === planId) ?? tiers[0];
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <Card className="max-w-md mx-auto border-2 text-center">
            <CardContent className="p-8 lg:p-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl">You're all set!</h2>
                <p className="text-muted-foreground">
                  You've enrolled in the {tier.name} plan. A confirmation email is on its way.
                </p>
              </div>
              <Button
                className="w-full h-12 bg-primary hover:bg-primary/90"
                onClick={() => onNavigate('home')}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl lg:text-5xl mb-4">Checkout</h1>
          <p className="text-lg text-muted-foreground">
            This is a demo checkout — no payment is actually processed.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader className="p-6 lg:p-8 space-y-2">
                <h2 className="text-xl">Payment Details</h2>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input id="cardName" type="text" placeholder="Jane Doe" className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Billing Email</Label>
                    <Input id="billingEmail" type="email" placeholder="you@example.com" className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="h-12 pl-10"
                        maxLength={19}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" type="text" placeholder="MM/YY" className="h-12" maxLength={5} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" type="text" placeholder="123" className="h-12" maxLength={4} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90">
                    Complete Purchase
                  </Button>
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4" />
                    Demo mode — no real payment is processed
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border-2 bg-slate-50">
              <CardHeader className="p-6 space-y-2">
                <h2 className="text-xl">Order Summary</h2>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-border flex items-baseline justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <div>
                    <span className="text-3xl text-primary">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
