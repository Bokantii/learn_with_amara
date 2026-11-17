import { redirect } from "next/navigation";
import { getSessionUser, hasVisibleEnrollment } from "../../../lib/authz";
import OnboardingEmptyState from "../OnboardingEmptyState";

/**
 * Enrollment gate for every dashboard page except Billing (route group — URLs
 * are unchanged). A student with any non-cancelled enrollment (PENDING /
 * PAUSED / COMPLETED included) gets these pages; course content inside them is
 * gated separately by `hasProgramAccess`. A student with no enrollment, or only
 * CANCELLED ones, gets the onboarding state instead.
 *
 * `/dashboard/billing` deliberately sits outside this group so a CANCELLED-only
 * student keeps read-only access to their own payment history (#20, V1
 * decision 2026-10-21) without regaining any of these pages.
 */
export default async function EnrolledDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const enrolled = await hasVisibleEnrollment(user.id);
  return enrolled ? children : <OnboardingEmptyState />;
}
