import { createClient } from "../supabase/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export class AppAuthError extends Error {
  readonly code = "UNAUTHENTICATED" as const;
  constructor(message = "UNAUTHENTICATED") {
    super(message);
    this.name = "AppAuthError";
  }
}

export interface RequireUserResult {
  supabase: SupabaseClient;
  user: User;
}

/**
 * First line of every action and reader:
 * const { supabase, user } = await requireUser()
 *
 * Always calls supabase.auth.getUser() (never trusts getSession() alone).
 * Throws AppAuthError("UNAUTHENTICATED") if the user is not authenticated.
 */
export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppAuthError("UNAUTHENTICATED");
  }

  return { supabase, user };
}

/**
 * Safe version of requireUser returning an ActionResult-compatible result without throwing.
 */
export async function safeRequireUser(): Promise<
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; error: { code: "UNAUTHENTICATED"; message: string } }
> {
  try {
    const { supabase, user } = await requireUser();
    return { ok: true, supabase, user };
  } catch {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Please log in to continue.",
      },
    };
  }
}
