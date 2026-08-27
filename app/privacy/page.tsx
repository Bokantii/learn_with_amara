import type { Metadata } from 'next';
import { PublicShell } from '../../components/PublicShell';

export const metadata: Metadata = {
  title: 'Privacy Policy | International Center for Language Proficiency',
  description: 'Privacy Policy for the ICLP web platform.',
};

export default function PrivacyPage() {
  return (
    <PublicShell>
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
            <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
              This page is a baseline draft prepared for ICLP and has not yet been reviewed by
              qualified legal counsel. It is provided for transparency and does not constitute
              legal advice. Do not treat it as a final, legally-reviewed policy until it has been
              approved by ICLP&apos;s legal counsel.
            </p>
          </div>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              This policy describes what information the International Center for Language
              Proficiency (&quot;ICLP&quot;, &quot;we&quot;, &quot;us&quot;) collects through the ICLP website and student
              platform, and how it is used.
            </p>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Account and profile data</h2>
              <p>
                When you create an account, we store your name, email address, and (for
                email/password accounts) a securely hashed password. If you sign in with Google or
                Facebook, we receive the basic profile information those providers share.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Enrollment and learning data</h2>
              <p>
                For enrolled students, we store program enrollment status, group/cohort membership,
                lesson progress, live class schedules, assignment submissions, and grades. This
                data is used to run the learning platform and is visible to you and to authorized
                ICLP staff.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Payments</h2>
              <p>
                Payments are processed by Stripe. We store a record of payment status and amount
                associated with your account, but we do not store your full card details — those
                are handled directly by Stripe.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Cookies, sessions and authentication</h2>
              <p>
                We use a session cookie to keep you signed in. This is required for the Platform to
                function and is not used for advertising.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Error monitoring</h2>
              <p>
                We use an error-monitoring service (Sentry) to help us detect and fix bugs. It may
                receive limited technical information about errors that occur while using the
                Platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Email and newsletter</h2>
              <p>
                We use a transactional email provider (Resend) to send account-related emails, such
                as welcome messages, grade notifications, and payment receipts. If you subscribe to
                our newsletter, we store your email address for that purpose; subscribing does not
                add you to any other mailing list.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Third-party processors</h2>
              <p>
                We share the minimum necessary data with the third-party services above (Stripe for
                payments, Resend for email, Sentry for error monitoring, and our OAuth providers
                Google and Facebook for sign-in) solely to provide the Platform&apos;s functionality.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Your data</h2>
              <p>
                You can review and update your account information from your account settings. To
                request deletion or export of your data, contact us at the email below.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl text-foreground">Contact</h2>
              <p>
                Questions about this policy can be sent to{' '}
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
