"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, GraduationCap, DollarSign, UsersRound, BookOpen, Video,
} from "lucide-react";

const navItems = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard },
  { path: "/admin/students", label: "Students", icon: Users },
  { path: "/admin/programs", label: "Programs", icon: BookOpen },
  { path: "/admin/groups", label: "Groups", icon: UsersRound },
  { path: "/admin/liveclasses", label: "Live Classes", icon: Video },
  { path: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { path: "/admin/grading", label: "Grading", icon: GraduationCap },
  { path: "/admin/payments", label: "Payments", icon: DollarSign },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.path === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-violet-50 text-violet-600"
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
