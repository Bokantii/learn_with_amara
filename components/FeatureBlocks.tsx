'use client';

import { Video, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

const icons = [Video, Users, TrendingUp];

export function FeatureBlocks() {
  const { language } = useLanguage();
  const copy = translations[language].featureBlocks;

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {copy.features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6 lg:p-8 space-y-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                  </div>
                  <h3 className="text-xl lg:text-2xl">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
