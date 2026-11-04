"use client";

import * as React from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await requestPasswordResetAction({ email });
        if (!result.ok) {
          setErrorMessage(result.error.message || "Please enter a valid email address.");
          return;
        }

        // Section 7.5: Always shows "If that email has an account, a reset link is on its way."
        setSubmitted(true);
      } catch {
        // Anti-enumeration: still display the safe copy even on failure
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col">
        <h1 className="text-[22px] font-bold text-[var(--ink)] mb-4">
          Check your email
        </h1>
        {/* Section 7.5 copy verbatim */}
        <p className="text-[16px] text-[var(--ink-soft)] leading-relaxed mb-6">
          If that email has an account, a reset link is on its way.
        </p>
        <Button asChild variant="outline" size="default" className="w-full font-bold">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-[22px] font-bold text-[var(--ink)] mb-2">
        Forgot password
      </h1>
      <p className="text-[14px] text-[var(--ink-soft)] mb-6">
        Enter your email to receive a password reset link.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
            aria-describedby={errorMessage ? "forgot-error" : undefined}
          />
        </div>

        {errorMessage && (
          <InlineError id="forgot-error" message={errorMessage} />
        )}

        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={isPending || !email}
          className="w-full mt-2 font-bold"
        >
          {isPending ? "Sending…" : "Send reset link"}
        </Button>

        <div className="text-center mt-2">
          <Link
            href="/login"
            className="text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)] underline underline-offset-4"
          >
            Back to log in
          </Link>
        </div>
      </form>
    </div>
  );
}
