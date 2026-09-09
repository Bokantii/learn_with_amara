'use client';
import Link from 'next/link';
import { GraduationCap, Users, BadgeCheck } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { translations } from '../lib/i18n/translations';

export function Hero() {
  const { language } = useLanguage();
  const copy = translations[language].hero;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6 lg:space-y-8">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-tight">
              {copy.title}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
              {copy.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-lg px-8 py-6"
                asChild
              >
                <Link href="/Pricing">{copy.getStarted}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
                asChild
              >
                <Link href="/Courses">{copy.exploreCourses}</Link>
              </Button>
            </div>
            <Link
              href="/assessments/placement"
              className="inline-block text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
            >
              {copy.testLevel}
            </Link>
            <ul className="mt-2 grid list-none gap-px overflow-hidden rounded-2xl border border-sky-100 bg-sky-100/70 p-0 shadow-sm sm:grid-cols-3">
              <li className="flex items-center gap-3 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-snug text-muted-foreground">
                  <span className="text-lg font-semibold text-primary">4</span> {copy.tracks}
                </span>
              </li>
              <li className="flex items-center gap-3 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-snug text-muted-foreground">{copy.communityTagline}</span>
              </li>
              <li className="flex items-center gap-3 bg-white/80 px-4 py-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-snug text-muted-foreground">{copy.examConfidence}</span>
              </li>
            </ul>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1653669487404-09c3617c2b6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcGVvcGxlJTIwbGVhcm5pbmclMjBvbmxpbmUlMjBsYXB0b3B8ZW58MXx8fHwxNzU5NzU4OTMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt={copy.imageAlt}
                className="w-full h-auto aspect-[4/3] object-cover"
              />
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-2xl opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary rounded-2xl opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
