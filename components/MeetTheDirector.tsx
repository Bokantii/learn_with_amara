import Link from 'next/link';
import { Button } from './ui/button';

export function MeetTheDirector() {
  return (
    <section className="py-12 lg:py-20 bg-slate-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl">Meet the Director</h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-left sm:text-center">
            ICLP is led by Amarachi Nwankpa, a French instructor with a background in Modern
            European Languages from Nnamdi Azikiwe University, Awka, where she studied French,
            Spanish, German and Chinese. Her teaching experience spans the Nigerian Army School of
            Electrical and Mechanical Engineering, the Nigerian Army Language Institute, and Bexley
            Montessori School, alongside private tutoring. She holds a DELF B2 certification,
            Spanish/DELE credentials, and additional certifications including Chinese/HSK-related
            study through the Confucius Institute. That classroom experience across multiple
            languages and learner levels shapes how ICLP structures every course and exam-prep
            track.
          </p>
          <Button variant="outline" className="border-2" asChild>
            <Link href="/about">Read the full story</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
