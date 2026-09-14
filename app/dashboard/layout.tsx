import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { getSessionUser, hasVisibleEnrollment } from "../../lib/authz";
import { getUnreadNotificationCount, getRecentNotifications } from "../../lib/notifications/queries";
import { NotificationBell } from "../../components/NotificationBell";
import NavLinks from "./NavLinks";
import OnboardingEmptyState from "./OnboardingEmptyState";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user?.id) {
    redirect("/SignIn");
  }

  // The dashboard shell shows for any student with a non-cancelled enrollment
  // (PENDING / PAUSED / COMPLETED included) — course content is gated separately.
  const enrolled = await hasVisibleEnrollment(user.id);
  const displayName = user.name ?? user.email ?? "there";
  const firstName = displayName.split(" ")[0];
  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(user.id),
    getRecentNotifications(user.id),
  ]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">ICLP</h1>
              <p className="text-xs text-slate-500">Language Institute</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500">Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}!</h2>
              <p className="text-sm text-slate-500 mt-1">Let&apos;s continue your learning journey</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell
                unreadCount={unreadCount}
                notifications={notifications}
                linkHref="/dashboard/liveclasses"
                dotClassName="bg-cyan-500"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50">
          {enrolled ? children : <OnboardingEmptyState />}
        </main>
      </div>
    </div>
  );
}
