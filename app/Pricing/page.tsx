import { PricingSection } from './../../components/PricingSection';
import { Card, CardContent } from './../../components/ui/card';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'We offer a 7-day free trial for all new users. No credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers for annual subscriptions.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with your learning experience.',
  },
  {
    question: 'Are the certificates recognized?',
    answer: 'Our certificates are recognized by employers and institutions worldwide. They include verification codes for authenticity.',
  },
  {
    question: 'Do you offer discounts for students?',
    answer: 'Yes! Students and educators get 20% off all plans with a valid ID. Contact our support team for details.',
  },
];

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

export default function Pricing({ onNavigate }: PricingPageProps) {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl lg:text-5xl mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your learning goals. All plans include access to our mobile app and community forum.
          </p>
        </div>

        <PricingSection onNavigate={onNavigate} />

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div className="space-y-2">
                      <h4 className="text-lg">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-br from-primary to-secondary text-white rounded-2xl p-8 lg:p-12">
          <h2 className="text-3xl lg:text-4xl mb-4">
            Still Have Questions?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Our support team is here to help you choose the right plan for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@iclp.com"
              className="px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="#"
              className="px-8 py-3 border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
