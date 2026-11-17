"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/** Ends the session and returns to the sign-in page. Used in the student and admin sidebars. */
export function SignOutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setPending(true);
        signOut({ redirectTo: "/SignIn" }).catch(() => setPending(false));
      }}
      disabled={pending}
      className="mt-1 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60"
    >
      <LogOut className="w-5 h-5" aria-hidden="true" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
