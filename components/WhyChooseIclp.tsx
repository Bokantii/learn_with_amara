'use client';

import { Video, BookOpen, MessageSquareText, PlayCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Reveal, RevealGroup, RevealItem } from './Reveal';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

const icons = [Video, BookOpen, MessageSquareText, PlayCircle];

export function WhyChooseIclp() {
  const { language } = useLanguage();
  const copy = translations[language].whyChoose;

  return (
    <section className="py-12 lg:py-20 bg-slate-50">
      <div className="container mx-auto px-4 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl mb-4">
            {copy.heading}
          </h2>
          <p className="text-lg text-muted-foreground">
            {copy.subheading}
          </p>
        </Reveal>

        <RevealGroup className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {copy.benefits.map((benefit, index) => {
            const Icon = icons[index];
            return (
              <RevealItem key={index} className="grid">
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 lg:p-8 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
