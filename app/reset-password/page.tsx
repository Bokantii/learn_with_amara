"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PublicShell } from "../../components/PublicShell";
import logo from "./../../assets/logo.png";
import { requestPasswordResetAction } from "./actions";

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await requestPasswordResetAction({ email });
      // Only a service outage is surfaced; it never depends on the address.
      if (result?.serverError) {
        setError(result.serverError);
        return;
      }
      // Otherwise always the same neutral confirmation — never reveal whether
      // the address is registered.
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <div className="min-h-[80vh] flex items-center justify-center py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="border-2">
              <CardHeader className="p-8 space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <Image src={logo} className="w-18 h-18 object-contain" alt="ICLP Logo" />
                </div>
                <h2 className="text-3xl">Reset your password</h2>
                <p className="text-muted-foreground">
                  Enter your email and we&apos;ll send you a link to choose a new password.
                </p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {submitted ? (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-slate-600">
                      If that email has an ICLP account, a reset link is on its way. The link expires
                      in 1 hour.
                    </p>
                    <Link className="text-primary hover:underline text-sm" href="/SignIn">
                      Back to sign in
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
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
                      {isSubmitting ? "Sending..." : "Send reset link"}
                    </Button>
                    <div className="text-center text-sm">
                      <Link className="text-primary hover:underline" href="/SignIn">
                        Back to sign in
                      </Link>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
