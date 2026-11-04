"use server";

import type { ActionResult } from "@/lib/contracts/common";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

/**
 * Initiates a password reset request.
 * Security requirement (D-10, Section 6.4): Always returns success data {}
 * to prevent account enumeration.
 */
export async function requestPasswordResetAction(
  rawInput: unknown
): Promise<ActionResult<Record<string, never>>> {
  const parsed = forgotPasswordSchema.safeParse(rawInput);
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
        message: "Please enter a valid email address.",
        fieldErrors,
      },
    };
  }

  const { email } = parsed.data;

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/confirm?next=/reset-password`;

    // Attempt reset; errors are caught and swallowed to prevent account enumeration
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  } catch (err) {
    // Log server-side without user identifiers
    console.error(
      "[Password Reset Request]: Failed to send reset email:",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  // Always return success to prevent user enumeration
  return {
    ok: true,
    data: {},
  };
}
