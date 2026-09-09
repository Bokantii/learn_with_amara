'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

export function PlacementCallout() {
  const { language } = useLanguage();
  const copy = translations[language].placementCallout;

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-6 md:p-10">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{copy.heading}</h2>
                <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-600">{copy.body}</p>
              </div>
            </div>
            <Button
              size="lg"
              asChild
              className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white text-base px-8 py-6"
            >
              <Link href="/assessments/placement">{copy.cta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
