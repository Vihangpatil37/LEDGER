"use client";

import * as React from "react";
import Link from "next/link";
import { updatePasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePasswordAction({ password });
        if (!result.ok) {
          setErrorMessage(result.error.message || "Could not update password. Try again.");
          return;
        }

        setSubmitted(true);
      } catch {
        setErrorMessage("Could not update password. Check your connection and try again.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col">
        <h1 className="text-[22px] font-bold text-[var(--ink)] mb-3">
          Password updated
        </h1>
        <p className="text-[16px] text-[var(--ink-soft)] mb-6">
          Your new password has been saved.
        </p>
        <Button asChild variant="primary" size="default" className="w-full font-bold">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-[22px] font-bold text-[var(--ink)] mb-2">
        Set new password
      </h1>
      <p className="text-[14px] text-[var(--ink-soft)] mb-6">
        Choose a secure password of at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Password field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            error={!!errorMessage}
            aria-describedby={errorMessage ? "reset-error" : undefined}
          />
        </div>

        {/* Confirm password field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            required
            error={!!errorMessage}
            aria-describedby={errorMessage ? "reset-error" : undefined}
          />
        </div>

        {errorMessage && (
          <InlineError id="reset-error" message={errorMessage} />
        )}

        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={isPending || !password || !confirmPassword}
          className="w-full mt-2 font-bold"
        >
          {isPending ? "Saving…" : "Set new password"}
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
