"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await loginAction({ email, password, next });
        if (!result.ok) {
          // Spec 7.8 verbatim: "Email or password is wrong."
          setErrorMessage(result.error.message || "Email or password is wrong.");
          return;
        }

        // Navigate to the target page
        window.location.href = result.data.redirectTo;
      } catch {
        // Fallback network error
        setErrorMessage("Email or password is wrong.");
      }
    });
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-[22px] font-bold text-[var(--ink)] mb-6">
        Log in
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Email Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
            error={!!errorMessage}
            aria-describedby={errorMessage ? "login-error" : undefined}
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)] underline underline-offset-4"
            >
              Forgot password
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            error={!!errorMessage}
            aria-describedby={errorMessage ? "login-error" : undefined}
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <InlineError id="login-error" message={errorMessage} />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={isPending || !email || !password}
          className="w-full mt-2 font-bold"
        >
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold text-[var(--ink)] mb-6">
            Log in
          </h1>
          <div className="h-48 flex items-center justify-center">
            <span className="text-[14px] text-[var(--ink-soft)]">Loading…</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
