"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SocialSignInButtons } from "../../components/SocialSignInButtons";
import Image from "next/image";
import logo from "./../../assets/logo.png";
import { PublicShell } from "../../components/PublicShell";

function OAuthErrorBanner({ onError }: { onError: (message: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error")) {
      onError("Unable to sign in with that provider. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

/**
 * Only accept a same-origin relative path (e.g. the attendance check-in URL) as
 * a post-login destination — never an absolute or protocol-relative URL — so
 * `?callbackUrl=` can't be used as an open redirect.
 */
function safeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.includes("\\") || /[\r\n\t]/.test(raw)) return null;
  try {
    const base = "http://internal.invalid";
    if (new URL(raw, base).origin !== base) return null;
  } catch {
    return null;
  }
  return raw;
}

function CallbackUrlReader({ onResolve }: { onResolve: (url: string | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onResolve(safeCallbackUrl(searchParams.get("callbackUrl")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError(
          result?.code === "rate_limited"
            ? "Too many sign-in attempts. Please wait a minute and try again."
            : result?.code === "unavailable"
              ? "Sign-in is temporarily unavailable. Please try again shortly."
              : "Invalid email or password."
        );
        return;
      }
      const session = await getSession();
      const roleDestination = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
      router.push(callbackUrl ?? roleDestination);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicShell>
    <div className="min-h-[80vh] flex items-center justify-center py-12 lg:py-20">
      <Suspense fallback={null}>
        <OAuthErrorBanner onError={setError} />
        <CallbackUrlReader onResolve={setCallbackUrl} />
      </Suspense>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="border-2">
            <CardHeader className="p-8 space-y-2 text-center">
              <div className="flex justify-center mb-4">
                {/* <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">ICLP</span>
                </div> */}
                <Image src={logo} className="w-18 h-18 object-contain" alt="ICLP Logo" />
              </div>
              <h2 className="text-3xl">Welcome Back</h2>
              <p className="text-muted-foreground">
                Sign in to continue your language learning journey
              </p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/reset-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 pr-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <SocialSignInButtons callbackUrl={callbackUrl ?? "/dashboard"} />

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Don&apos;t have an account?{" "}
                </span>
                <Link className="text-primary hover:underline" href="/SignUp">
                  Sign up for free
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
