import type { Metadata } from 'next';
import { PublicShell } from '../../components/PublicShell';

export const metadata: Metadata = {
  title: 'Terms of Service | International Center for Language Proficiency',
  description: 'Terms of Service for the ICLP web platform.',
};

export default function TermsPage() {
  return (
    <PublicShell>
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
            <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
              This page is a baseline draft prepared for ICLP and has not yet been reviewed by
              qualified legal counsel. It is provided for transparency and does not constitute
              legal advice. Do not treat it as a final, legally-reviewed policy until it has been
              approved by ICLP&apos;s legal counsel.
            </p>
          </div>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-xl text-foreground">1. Use of the platform</h2>
              <p>
                These Terms govern your use of the ICLP website and student platform (the
                &quot;Platform&quot;), operated by the International Center for Language Proficiency
                (&quot;ICLP&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account or using the Platform, you agree to
                these Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">2. Accounts</h2>
              <p>
                You must provide accurate information when creating an account and are responsible
                for keeping your login credentials secure. You may sign in with an email and
                password or through a supported third-party provider (currently Google and
                Facebook). Creating an account does not by itself enroll you in a program —
                enrollment is a separate step tied to a specific program.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">3. Course and service access</h2>
              <p>
                Access to program content, live classes, recorded lessons, and assignments is
                granted based on your active enrollment status. ICLP may update, reschedule, or
                discontinue specific classes or content, and will make reasonable efforts to notify
                affected students of significant changes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">4. Payments and refunds</h2>
              <p>
                Paid programs are billed through our payment processor (Stripe). Prices are shown
                in the currency selected at checkout. Refund eligibility depends on the specific
                program and how much of it has been delivered at the time of a refund request;
                contact us at the email below to discuss a refund request.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">5. Intellectual property</h2>
              <p>
                Course materials, videos, lesson content, and assessments made available through
                the Platform are owned by ICLP or its licensors. You may use them for your own
                learning; you may not redistribute, resell, or publicly republish them without
                permission.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">6. Acceptable use</h2>
              <p>
                You agree not to misuse the Platform — including attempting to access another
                student&apos;s account or data, disrupting live classes, sharing account credentials, or
                using the Platform for any unlawful purpose.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">7. Changes to the service</h2>
              <p>
                We may update, add to, or remove features of the Platform over time. We will make
                reasonable efforts to preserve access to content and progress tied to an active
                enrollment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">8. Limitation of liability</h2>
              <p>
                The Platform is provided on an &quot;as available&quot; basis. To the fullest extent
                permitted by law, ICLP is not liable for indirect or incidental damages arising
                from your use of the Platform. Nothing in these Terms limits liability that cannot
                be limited under applicable law.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">9. Contact</h2>
              <p>
                Questions about these Terms can be sent to{' '}
                <a href="mailto:centerforlanguageproficiency@gmail.com" className="text-primary hover:underline">
                  centerforlanguageproficiency@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
