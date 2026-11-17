"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SocialSignInButtons } from "../../components/SocialSignInButtons";
import Image from "next/image";
import logo from "./../../assets/logo.png";
import { signUpAction } from "./actions";
import { PublicShell } from "../../components/PublicShell";

export default function SignUp() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUpAction({ firstName, lastName, email, password });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (!signInResult || signInResult.error) {
        setError("Account created — please sign in.");
        router.push("/SignIn");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
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
              <h2 className="text-3xl">Create Your Account</h2>
              <p className="text-muted-foreground">
                Sign up to begin your French learning journey
              </p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      className="h-12"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      className="h-12"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
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
                    <Label htmlFor="repeatPassword">Repeat Password</Label>
                    <div className="relative">
                      <Input
                        id="repeatPassword"
                        type={showRepeatPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 pr-11"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRepeatPassword((v) => !v)}
                        aria-label={showRepeatPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {isSubmitting ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>

              <SocialSignInButtons callbackUrl={"/dashboard"} />

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Already have an account?{" "}
                </span>
                <Link className="text-primary hover:underline" href="/SignIn">
                  Sign in instead
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
