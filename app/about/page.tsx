import type { Metadata } from 'next';
import Image from 'next/image';
import { PublicShell } from '../../components/PublicShell';
import { Reveal } from '../../components/Reveal';
import amara from '../../assets/amara.png';

export const metadata: Metadata = {
  title: 'About | International Center for Language Proficiency',
  description:
    'Meet Amarachi Nwankpa, Director of the International Center for Language Proficiency (ICLP), and learn about our approach to French and exam-prep instruction.',
};

export default function AboutPage() {
  return (
    <PublicShell>
    <div className="py-12 lg:py-20 overflow-x-clip">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <Reveal className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl">About ICLP</h1>
            <p className="text-lg text-muted-foreground">
              The International Center for Language Proficiency (ICLP) helps learners build real
              French fluency and prepare for the TCF, TEF, DELF and DALF exams.
            </p>
          </Reveal>

          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl lg:text-3xl text-center">Meet the Director</h2>
            </Reveal>
            <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-12">
              <Reveal direction="left" className="w-full max-w-md mx-auto md:mx-0 md:max-w-none md:w-1/2 flex-shrink-0">
                <Image
                  src={amara}
                  alt="Amarachi Nwankpa, Director of ICLP"
                  placeholder="blur"
                  sizes="(max-width: 768px) 448px, 512px"
                  className="w-full h-auto rounded-2xl object-cover shadow-xl ring-1 ring-black/5"
                />
              </Reveal>
              <Reveal direction="right" delay={0.1} className="flex-1 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  ICLP is led by Amarachi Nwankpa. She holds a B.A. in Modern European Languages
                  from Nnamdi Azikiwe University, Awka (2014–2018), where her studies covered
                  French, Spanish, German and Chinese — a multi-language foundation that continues
                  to inform how ICLP designs its own French and exam-prep curriculum.
                </p>
                <p>
                  Her teaching career began during her National Youth Service, where she taught at
                  the Nigerian Army School of Electrical and Mechanical Engineering, Auchi. She went
                  on to teach French at the Nigerian Army Language Institute in Ovim, Isuikwuato,
                  Abia State, and later taught French, Spanish and Government at Bexley Montessori
                  School, Awka — alongside private home tutoring for individual language learners.
                </p>
                <p>
                  Amarachi holds a DELF B2 certification in French, Spanish/DELE credentials, and
                  additional language certifications, including Chinese/HSK-related study completed
                  through the Confucius Institute in partnership with Beijing Language and Culture
                  University. That combination of formal academic training and hands-on classroom
                  experience — teaching learners at different levels, in different institutions, and
                  in more than one language — is the foundation ICLP&apos;s courses and exam-preparation
                  tracks are built on.
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl lg:text-3xl text-center">Our Approach</h2>
            <p className="text-muted-foreground leading-relaxed">
              ICLP focuses on French — for learners starting from scratch and for those who
              already speak French and need focused preparation for the TCF, TEF, DELF or DALF
              exams. Courses combine structured lessons, live classes, and exam-style practice, so
              learners always know what&apos;s next on their path to fluency and exam readiness.
            </p>
          </Reveal>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
