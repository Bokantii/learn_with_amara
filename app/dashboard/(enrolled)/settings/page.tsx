"use client";

import { ChangePasswordCard } from "./ChangePasswordCard";

export default function Settings() {
  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Settings
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Manage your account security
        </p>
      </div>

      {/*
        Profile, Notifications, Language and 2FA are deferred (SPEC Known
        Deferred Issue #23a) — they persisted nothing, so rather than ship
        controls that silently do nothing, only the working section stays.
      */}
      <ChangePasswordCard />
    </div>
  );
}
