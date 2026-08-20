'use client';

import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

const highlightedFlags = [true, false];

interface PricingSectionProps {
  onNavigate: (page: string, planId?: string) => void;
}

export function PricingSection({ onNavigate }: PricingSectionProps) {
  const { language } = useLanguage();
  const copy = translations[language].pricingSection;

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl mb-4">
            {copy.heading}
          </h2>
          <p className="text-lg text-muted-foreground">
            {copy.subheading}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {copy.tiers.map((tier, index) => {
            const highlighted = highlightedFlags[index];
            return (
              <Card
                key={index}
                className={`relative border-2 transition-all duration-300 ${
                  highlighted
                    ? 'border-primary shadow-xl scale-105 lg:scale-110'
                    : 'border-border hover:border-primary/50 hover:shadow-lg'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full">
                    {copy.mostPopular}
                  </div>
                )}
                <CardHeader className="p-6 lg:p-8 space-y-2">
                  <h3 className="text-2xl">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                  <div className="pt-4">
                    <span className="text-4xl lg:text-5xl text-primary">
                      {tier.price}
                    </span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      highlighted
                        ? 'bg-accent hover:bg-accent/90'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    size="lg"
                    onClick={() => onNavigate('checkout', tier.id)}
                  >
                    {copy.choosePlan}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
