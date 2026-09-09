import { Hero } from '../components/Hero';
import { PlacementCallout } from '../components/PlacementCallout';
import { FeatureBlocks } from '../components/FeatureBlocks';
import { Testimonials } from '../components/Testimonials';
import { PricingTeaser } from '../components/PricingTeaser';
import { MeetTheDirector } from '../components/MeetTheDirector';
import { PublicShell } from '../components/PublicShell';

export default function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <PlacementCallout />
      <FeatureBlocks />
      <MeetTheDirector />
      <Testimonials />
      <PricingTeaser />
    </PublicShell>
  );
}
