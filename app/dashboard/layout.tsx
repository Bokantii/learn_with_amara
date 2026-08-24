import Link from "next/link";
import {
  LayoutDashboard, BookOpen, Video, PlayCircle,
  ClipboardList, BarChart3, CreditCard,
  Settings as SettingsIcon, Bell, User,
} from "lucide-react";
import NavLinks from "./NavLinks";
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/myprograms", label: "My Programs", icon: BookOpen },
  { path: "/dashboard/liveclasses", label: "Live Classes", icon: Video },
  { path: "/dashboard/recordedlessons", label: "Recorded Lessons", icon: PlayCircle },
  { path: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
  { path: "/dashboard/results", label: "Results", icon: BarChart3 },
  { path: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { path: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Sarah Chen</p>
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
              <h2 className="text-2xl font-bold text-slate-900">Welcome back, Sarah!</h2>
              <p className="text-sm text-slate-500 mt-1">Let's continue your learning journey</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}