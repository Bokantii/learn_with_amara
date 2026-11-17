"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

/**
 * Below the `lg` breakpoint the dashboard sidebar is hidden. This menu button
 * opens the same sidebar content (passed as children) in a left drawer, which
 * closes when a link in it is followed.
 */
export function DashboardMobileNav({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden -ml-2 p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 gap-0 flex flex-col overflow-y-auto">
        <SheetTitle className="sr-only">{label}</SheetTitle>
        <div
          className="flex flex-1 flex-col"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
