"use client";

import { Card } from "./ui/card";
import { CopyLinkButton } from "./CopyLinkButton";

/**
 * Shown on `/admin/students` and `/admin/staff` when an invite email could not
 * be sent — hands the admin the one-time activation link(s) to share manually.
 * `links` is keyed by the invitee's email (or id), value is the URL.
 */
export function InviteLinkPanel({ links }: { links: Record<string, string> }) {
  const entries = Object.entries(links);
  if (entries.length === 0) return null;

  return (
    <Card className="p-4 border-amber-200 bg-amber-50">
      <p className="text-sm font-medium text-amber-900">
        Email delivery isn&apos;t configured — share these one-time activation links manually:
      </p>
      <ul className="mt-2 space-y-2">
        {entries.map(([key, url]) => (
          <li key={key} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-700">{key}:</span>
            <code className="rounded bg-white px-2 py-1 text-xs text-slate-600 break-all">{url}</code>
            <CopyLinkButton url={url} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
