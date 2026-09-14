"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

export function CopyLinkButton({ url, label = "Copy invite link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable — the link is still visible next to this button */
        }
      }}
    >
      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
