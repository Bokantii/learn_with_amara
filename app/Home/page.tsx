'use client';
import { Hero } from '../../components/Hero';
import { FeatureBlocks } from '../../components/FeatureBlocks';
import { Testimonials } from '../../components/Testimonials';
import { PricingTeaser } from '../../components/PricingTeaser';

interface HomeProps {
  onNavigate: (page: string, planId?: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div>
      <Hero onNavigate={onNavigate} />
      <FeatureBlocks />
      <Testimonials />
      <PricingTeaser onNavigate={onNavigate} />
    </div>
  );
}
