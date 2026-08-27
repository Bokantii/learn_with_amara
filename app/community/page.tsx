import type { Metadata } from 'next';
import { PublicShell } from '../../components/PublicShell';

export const metadata: Metadata = {
  title: 'Community | International Center for Language Proficiency',
  description: 'How cohort and group learning works at ICLP for enrolled students.',
};

export default function CommunityPage() {
  return (
    <PublicShell>
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl">Community</h1>
            <p className="text-lg text-muted-foreground">
              Learning a language works best with other people. Here&apos;s how ICLP builds that in.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">Cohort and group learning</h2>
            <p className="text-muted-foreground leading-relaxed">
              Many ICLP programs are organized around groups — a cohort of students learning
              together on the same schedule, attending the same live classes, and working toward
              the same exam goal. Groups give structure to your learning: a set pace, classmates
              at a similar level, and a shared live-class schedule you can plan around.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">Accessing your group</h2>
            <p className="text-muted-foreground leading-relaxed">
              Once you&apos;re enrolled in a program, any group you&apos;re placed in appears on your
              student dashboard, along with your group&apos;s scheduled live classes. There&apos;s nothing
              extra to sign up for — group access is part of being enrolled in a program that uses
              cohort scheduling.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">Not enrolled yet?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Browse our programs and pricing to find a track that fits your goals, then create an
              account to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
