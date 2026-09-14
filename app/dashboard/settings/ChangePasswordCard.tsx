"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "./actions";

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="relative mt-2">
        <Input
          id={id}
          type={show ? "text" : "password"}
          className="text-sm pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordCard() {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    startTransition(async () => {
      const result = await changePasswordAction({ currentPassword: current, newPassword: next });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setOk(true);
    });
  };

  return (
    <Card className="p-4 md:p-6">
      <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4 md:mb-6">Change Password</h3>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <PasswordField id="current-password" label="Current Password" value={current} onChange={setCurrent} />
        <PasswordField id="new-password" label="New Password" value={next} onChange={setNext} />
        <PasswordField id="confirm-password" label="Confirm New Password" value={confirm} onChange={setConfirm} />

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {ok && (
          <p className="text-sm text-emerald-600" role="status">
            Your password has been updated. For security you have been signed out of other
            sessions — sign in again to continue.
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9"
          >
            {isPending ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
