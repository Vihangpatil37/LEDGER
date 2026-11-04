import type { Settings } from "../contracts/settings";
import { DEFAULT_REMINDER_TEMPLATE } from "../reminder";
import { requireUser } from "./auth";
import { mapSettings } from "./mappers";

/**
 * Loads shop settings and preferences for the authenticated owner from public.profiles.
 */
export async function getSettings(): Promise<Settings> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("[getSettings error]:", error?.message);
    return {
      shopName: null,
      ownerName: null,
      phone: null,
      defaultAlertStep: "500.00",
      reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
    };
  }

  return mapSettings(data);
}
