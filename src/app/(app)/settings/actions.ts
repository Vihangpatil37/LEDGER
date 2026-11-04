"use server";

import type { ActionResult } from "@/lib/contracts/common";
import {
  type Settings,
  updateSettingsSchema,
} from "@/lib/contracts/settings";
import { normalizePhone } from "@/lib/phone";
import { validateReminderTemplate } from "@/lib/reminder";
import { safeRequireUser } from "@/lib/server/auth";
import { handleServerError } from "@/lib/server/errors";
import { mapSettings } from "@/lib/server/mappers";
import { revalidatePath } from "next/cache";

/**
 * Updates shop profile, owner details, default alert step, and WhatsApp reminder template.
 */
export async function updateSettingsAction(
  rawInput: unknown
): Promise<ActionResult<Settings>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return auth;
  }
  const { supabase, user } = auth;

  const parsed = updateSettingsSchema.safeParse(rawInput);
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
        message: "Please check settings input.",
        fieldErrors,
      },
    };
  }

  const { shopName, ownerName, phone, defaultAlertStep, reminderTemplate } =
    parsed.data;

  // Phone validation & normalization (if phone is provided)
  let normalizedPhone: string | null = null;
  if (phone && phone.trim()) {
    normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return {
        ok: false,
        error: {
          code: "INVALID_PHONE",
          message: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
          fieldErrors: {
            phone: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
          },
        },
      };
    }
  }

  // Template validation (length 10..800, contains {name} and {amount}, only allowed tags)
  const templateCheck = validateReminderTemplate(reminderTemplate);
  if (!templateCheck.valid) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: templateCheck.error ?? "Invalid reminder template.",
        fieldErrors: {
          reminderTemplate: templateCheck.error ?? "Invalid reminder template.",
        },
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        shop_name: shopName ?? null,
        owner_name: ownerName ?? null,
        phone: normalizedPhone,
        default_alert_step: Number(defaultAlertStep),
        reminder_template: reminderTemplate,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      return handleServerError(error);
    }

    revalidatePath("/settings");
    revalidatePath("/");
    revalidatePath("/customers");

    return {
      ok: true,
      data: mapSettings(data),
    };
  } catch (err) {
    return handleServerError(err);
  }
}
