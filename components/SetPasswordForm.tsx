"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SetPasswordFormProps {
  /** Runs the server action with the chosen password. Success is `data.ok`; anything else is an error. */
  action: (
    password: string
  ) => Promise<{ data?: { ok?: boolean }; serverError?: string; validationErrors?: unknown } | undefined>;
  submitLabel: string;
  pendingLabel: string;
  successTitle: string;
  successBody: string;
}

export function SetPasswordForm({
  action,
  submitLabel,
  pendingLabel,
  successTitle,
  successBody,
}: SetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await action(password);
      if (!result?.data?.ok) {
        setError(
          result?.serverError ??
            "This link is invalid or has expired. Request a new one."
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-semibold text-slate-900">{successTitle}</h3>
        <p className="text-sm text-slate-600">{successBody}</p>
        <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90">
          <Link href="/SignIn">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="h-12 pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            className="h-12 pr-11"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-12 bg-primary hover:bg-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
