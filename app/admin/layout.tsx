import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getSessionUser } from "../../lib/authz";
import { getUnreadNotificationCount, getRecentNotifications } from "../../lib/notifications/queries";
import { NotificationBell } from "../../components/NotificationBell";
import NavLinks from "./NavLinks";
import { SignOutButton } from "../../components/SignOutButton";
import { DashboardMobileNav } from "../../components/DashboardMobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/SignIn");
  }

  const admin = { name: user.name ?? "Admin" };
  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(user.id),
    getRecentNotifications(user.id),
  ]);

  const sidebar = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">ICLP Admin</h1>
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{admin.name}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col">
        {sidebar}
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <DashboardMobileNav label="Admin menu">{sidebar}</DashboardMobileNav>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">Welcome back, {admin.name.split(" ")[0]}!</h2>
              <p className="hidden sm:block text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening across your programs</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell
                unreadCount={unreadCount}
                notifications={notifications}
                linkHref="/admin/liveclasses"
                dotClassName="bg-fuchsia-500"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
