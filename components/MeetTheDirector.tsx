import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import amara1 from '../assets/amara1.jpeg';

export function MeetTheDirector() {
  return (
    <section className="py-12 lg:py-20 bg-slate-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl lg:text-4xl text-center">Meet the Director</h2>

          <div className="mt-8 lg:mt-12 flex flex-col md:flex-row md:items-center gap-8 lg:gap-12">
            {/* Portrait */}
            <div className="w-full max-w-sm mx-auto md:mx-0 md:w-2/5 flex-shrink-0">
              <Image
                src={amara1}
                alt="Amarachi Nwankpa, Director of ICLP"
                placeholder="blur"
                sizes="(max-width: 768px) 384px, 33vw"
                className="w-full h-auto rounded-2xl object-cover shadow-xl ring-1 ring-black/5"
                priority={false}
              />
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 text-left">
              <div>
                <p className="text-xl font-semibold text-foreground">Amarachi Nwankpa</p>
                <p className="text-sm text-muted-foreground">Director, ICLP</p>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ICLP is led by Amarachi Nwankpa, a French instructor with a background in Modern
                European Languages from Nnamdi Azikiwe University, Awka, where she studied French,
                Spanish, German and Chinese. Her teaching experience spans the Nigerian Army School
                of Electrical and Mechanical Engineering, the Nigerian Army Language Institute, and
                Bexley Montessori School, alongside private tutoring. She holds a DELF B2
                certification, Spanish/DELE credentials, and additional certifications including
                Chinese/HSK-related study through the Confucius Institute. That classroom experience
                across multiple languages and learner levels shapes how ICLP structures every course
                and exam-prep track.
              </p>
              <Button variant="outline" className="border-2" asChild>
                <Link href="/about">Read the full story</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
