"use server";

import type { ActionResult } from "@/lib/contracts/common";
import { safeRequireUser } from "@/lib/server/auth";
import { handleServerError } from "@/lib/server/errors";
import { z } from "zod";

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export async function updatePasswordAction(
  rawInput: unknown
): Promise<ActionResult<Record<string, never>>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Your session has expired. Please log in or request a new reset link.",
      },
    };
  }

  const parsed = updatePasswordSchema.safeParse(rawInput);
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
        message: "Password must be between 8 and 72 characters.",
        fieldErrors,
      },
    };
  }

  try {
    const { error } = await auth.supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return handleServerError(error);
    }

    return {
      ok: true,
      data: {},
    };
  } catch (err) {
    return handleServerError(err);
  }
}
