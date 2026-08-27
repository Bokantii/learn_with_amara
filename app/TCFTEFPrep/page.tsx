import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from './../../components/ui/card';
import { Button } from './../../components/ui/button';
import { CheckCircle, BookOpen, Headphones, FileText, Video, Target, GraduationCap, Rocket } from 'lucide-react';
import { PublicShell } from './../../components/PublicShell';

export const metadata: Metadata = {
  title: 'Exam Prep | International Center for Language Proficiency',
  description: 'TCF, TEF, DELF and DALF exam preparation — mock exams, scoring strategy, and timed practice.',
};

const paths = [
  {
    icon: BookOpen,
    name: 'Beginner to TCF/TEF',
    description: "New to French? Start from A0 and build toward exam-ready fluency, with TCF/TEF prep built into the final stretch.",
    cta: 'Start From Scratch',
  },
  {
    icon: Target,
    name: 'TCF/TEF Exam Prep Only',
    description: 'Already speak French? Skip the fundamentals and go straight into focused exam prep.',
    cta: 'Fast-Track My Exam',
  },
  {
    icon: GraduationCap,
    name: 'Beginner to DELF/DALF',
    description: 'New to French? Start from A1 and build toward your target DELF or DALF level, one diploma at a time.',
    cta: 'Start From Scratch',
  },
  {
    icon: Rocket,
    name: 'DELF/DALF Exam Prep Only',
    description: 'Already speak French? Skip the fundamentals and go straight into focused DELF or DALF exam prep.',
    cta: 'Fast-Track My Exam',
  },
];

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
    <PublicShell>
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl mb-4">
            French Exam Preparation
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            TCF, TEF, DELF, or DALF — whether you&apos;re starting French from scratch or already
            speak it fluently, we&apos;ll get you ready for immigration, study, or work.
          </p>
          <Button size="lg" className="bg-accent hover:bg-accent/90" asChild>
            <Link href="/Pricing">Start Your Preparation</Link>
          </Button>
        </div>

        {/* Choose Your Path */}
        <div className="mb-16">
          <h2 className="text-3xl text-center mb-4">Choose Your Path</h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Whichever path you&apos;re on, you&apos;ll practice with the same real exam materials below.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {paths.map((path, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <path.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl">{path.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {path.description}
                  </p>
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href="/Pricing">{path.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* What's Included */}
        <div className="mb-16">
          <h2 className="text-3xl text-center mb-12">What&apos;s Included</h2>
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
              <div className="space-y-2">
                <Button size="lg" className="bg-primary hover:bg-primary/90" disabled>
                  Take a Practice Exam
                </Button>
                <p className="text-sm text-muted-foreground">
                  Practice exams are launching in a future update — check back soon.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl mb-6">TCF/TEF Scoring Guide</h3>
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
          <div className="mt-8 bg-white rounded-xl p-6 lg:p-8 shadow-xl">
            <h3 className="text-xl mb-2">Prefer DELF/DALF instead?</h3>
            <p className="text-muted-foreground">
              DELF and DALF work differently: each level — A1, A2, B1, B2 (DELF) or C1, C2 (DALF)
              — is its own diploma. Pass one, and it&apos;s yours for life, with no expiry and no need
              to retake other levels.
            </p>
          </div>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
