import { Card, CardContent, CardHeader } from './../../components/ui/card';
import { Button } from './../../components/ui/button';
import { CheckCircle, BookOpen, Headphones, FileText, Video } from 'lucide-react';

const examFeatures = [
  {
    icon: Video,
    title: 'Expert-Led Video Lessons',
    description: 'Comprehensive video tutorials covering all exam sections and strategies.',
  },
  {
    icon: Headphones,
    title: 'Listening Practice',
    description: 'Hundreds of authentic listening exercises with transcripts and explanations.',
  },
  {
    icon: FileText,
    title: 'Writing Workshops',
    description: 'Learn essay structure, formal writing, and get personalized feedback.',
  },
  {
    icon: BookOpen,
    title: 'Reading Comprehension',
    description: 'Practice with real exam-style texts and learn time management techniques.',
  },
];

const mockExamBenefits = [
  'Full-length practice exams in real test conditions',
  'Detailed performance analysis and scoring',
  'Personalized study recommendations',
  'Timed sections to improve speed',
  'Answer explanations for every question',
  'Track your progress over time',
];

export default function TCFTEFPrep() {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl mb-4">
            TCF & TEF Exam Preparation
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Ace your French proficiency exams with our comprehensive preparation courses. 
            We'll help you achieve the score you need for immigration, study, or work.
          </p>
          <Button size="lg" className="bg-accent hover:bg-accent/90">
            Start Your Preparation
          </Button>
        </div>

        {/* What's Included */}
        <div className="mb-16">
          <h2 className="text-3xl text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {examFeatures.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mock Exams Section */}
        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl">
                Practice with Mock Exams
              </h2>
              <p className="text-lg text-muted-foreground">
                Our realistic mock exams simulate the actual test experience, helping you 
                build confidence and identify areas for improvement.
              </p>
              <ul className="space-y-3">
                {mockExamBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Take a Practice Exam
              </Button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl mb-6">Exam Scoring Guide</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <span>C2 (Advanced)</span>
                  <span className="font-medium">600-699</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <span>C1 (Advanced)</span>
                  <span className="font-medium">500-599</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <span>B2 (Upper Intermediate)</span>
                  <span className="font-medium">400-499</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span>B1 (Intermediate)</span>
                  <span className="font-medium">300-399</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <span>A2 (Elementary)</span>
                  <span className="font-medium">200-299</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
