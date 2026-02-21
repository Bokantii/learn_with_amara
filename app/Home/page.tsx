import { Hero } from './../../components/Hero';
import { FeatureBlocks } from './../../components/FeatureBlocks';
import { Testimonials } from './../../components/Testimonials';
import { PricingSection } from './../../components/PricingSection';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div>
      <Hero onNavigate={onNavigate} />
      <FeatureBlocks />
      <Testimonials />
      <PricingSection onNavigate={onNavigate} />
    </div>
  );
}
