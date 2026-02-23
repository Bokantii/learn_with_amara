import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';

const pricingTiers = [
  {
    name: 'Starter',
    price: '$300',
    period: '/3 months',
    description: 'Perfect for beginners exploring a new language',
    features: [
      'Access to 1 language course',
      'Basic video lessons & PDFs',
      'Community forum access',
      'Progress tracking',
      'Mobile app access',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$800',
    period: '/6 months',
    description: 'Best for serious learners and exam preparation',
    features: [
      'Access to 3 language courses',
      'All video lessons, PDFs & quizzes',
      'Live tutor sessions (4/month)',
      'Mock exams & practice tests',
      'Advanced progress analytics',
      'Certificate upon completion',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'All-Access',
    price: '$99',
    period: '/month',
    description: 'Unlimited learning for language enthusiasts',
    features: [
      'All 8 language courses',
      'Unlimited video lessons & resources',
      'Unlimited live tutor sessions',
      'All exam prep materials',
      'Personal learning coach',
      'All certificates included',
      'VIP support 24/7',
      'Exclusive masterclasses',
    ],
    highlighted: false,
  },
];

interface PricingSectionProps {
  onNavigate: (page: string) => void;
}

export function PricingSection({ onNavigate }: PricingSectionProps) {
  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl mb-4">
            Choose Your Learning Path
          </h2>
          <p className="text-lg text-muted-foreground">
            Flexible pricing plans designed to fit your language learning goals and budget.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative border-2 transition-all duration-300 ${
                tier.highlighted
                  ? 'border-primary shadow-xl scale-105 lg:scale-110'
                  : 'border-border hover:border-primary/50 hover:shadow-lg'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full">
                  Most Popular
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
                    tier.highlighted
                      ? 'bg-accent hover:bg-accent/90'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  size="lg"
                  onClick={() => onNavigate('pricing')}
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
