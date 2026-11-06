"use server";

import type { ActionResult } from "@/lib/contracts/common";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

function sanitizeRedirect(nextPath?: string | null): string {
  if (!nextPath) return "/";
  // Prevent open redirect vulnerabilities: must start with / and not // or /\
  if (nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.startsWith("/\\")) {
    return nextPath;
  }
  return "/";
}

export async function loginAction(
  rawInput: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "general";
      fieldErrors[field] = issue.message;
    }
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Email or password is wrong.",
        fieldErrors,
      },
    };
  }

  const { email, password, next } = parsed.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const authErrorMessage = (error.message || "").toLowerCase();
      const isEmailNotConfirmed =
        authErrorMessage.includes("not confirmed") ||
        authErrorMessage.includes("unconfirmed") ||
        authErrorMessage.includes("confirm your email");

      if (isEmailNotConfirmed) {
        return {
          ok: false,
          error: {
            code: "EMAIL_NOT_CONFIRMED",
            message: "Confirm your email before logging in.",
          },
        };
      }

      return {
        ok: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is wrong.",
        },
      };
    }

    const redirectTo = sanitizeRedirect(next);
    return {
      ok: true,
      data: { redirectTo },
    };
  } catch (err) {
    console.error("[Login Action Error]:", err instanceof Error ? err.message : "Unknown error");
    return {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Could not save. Nothing was changed. Try again.",
      },
    };
  }
}

export async function logoutAction(): Promise<ActionResult<Record<string, never>>> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[Logout Action Error]:", err instanceof Error ? err.message : "Unknown error");
  }

  // Redirect to /login after signing out
  redirect("/login");
}
