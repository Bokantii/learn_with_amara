"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Video, PlayCircle,
  ClipboardList, BarChart3, CreditCard,
  Settings as SettingsIcon,
} from "lucide-react";

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

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.path === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-sky-50 text-sky-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}