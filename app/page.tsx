import { Hero } from '../components/Hero';
import { FeatureBlocks } from '../components/FeatureBlocks';
import { Testimonials } from '../components/Testimonials';
import { PricingTeaser } from '../components/PricingTeaser';
import { MeetTheDirector } from '../components/MeetTheDirector';
import { PublicShell } from '../components/PublicShell';

export default function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <FeatureBlocks />
      <MeetTheDirector />
      <Testimonials />
      <PricingTeaser />
    </PublicShell>
  );
}
