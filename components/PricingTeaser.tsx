'use client';

import ProgrammeCard from './ProgrammeCard';
import { Button } from './ui/button';
import { findProgrammeById, type Programme } from '../lib/programmes';

// A "starting from" highlight per category — kept in sync with lib/programmes.ts,
// the same source of truth /Pricing reads from, so these can't drift out of date.
const HIGHLIGHT_IDS = [
  'group-french-a0-a2',
  'group-tef-tcf-canada-prep',
  'private-french-enthusiast-premier',
];

const TEASER_CURRENCY = 'CAD';

interface PricingTeaserProps {
  onNavigate: (page: string, planId?: string) => void;
}

export function PricingTeaser({ onNavigate }: PricingTeaserProps) {
  const highlights = HIGHLIGHT_IDS.map((id) => findProgrammeById(id)).filter(
    (p): p is Programme => Boolean(p)
  );

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl mb-4">Simple, Transparent Tuition</h2>
          <p className="text-lg text-muted-foreground">
            Group French, TEF/TCF exam prep, and Private classes — priced in CAD, NGN, USD, or GBP.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {highlights.map((programme) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              currency={TEASER_CURRENCY}
              isSelected={false}
              isNavigating={false}
              ctaLabel="View Pricing"
              highlightLabel={
                programme.id === 'group-french-a0-a2' ? 'Most Popular' : undefined
              }
              onSelect={() => onNavigate('pricing')}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="lg"
            className="border-2"
            onClick={() => onNavigate('pricing')}
          >
            View Full Pricing &amp; Currencies
          </Button>
        </div>
      </div>
    </section>
  );
}
