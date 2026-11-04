"use server";

import type { ActionResult } from "@/lib/contracts/common";
import {
  type CustomerBalance,
  createCustomerSchema,
  setCustomerActiveSchema,
  updateCustomerSchema,
} from "@/lib/contracts/customers";
import { normalizePhone } from "@/lib/phone";
import { safeRequireUser } from "@/lib/server/auth";
import { handleServerError } from "@/lib/server/errors";
import { mapCustomerBalance } from "@/lib/server/mappers";
import { revalidatePath } from "next/cache";

export interface DuplicatePhoneMatch {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * Checks for existing customers with the same phone under the current owner.
 * If excludeId is provided, it excludes that specific record from the check.
 */
export async function findDuplicateCustomers(
  supabase: any,
  ownerId: string,
  phone: string,
  excludeId?: string
): Promise<DuplicatePhoneMatch[]> {
  let query = supabase
    .from("customers")
    .select("id, name, is_active")
    .eq("owner_id", ownerId)
    .eq("phone", phone);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    isActive: Boolean(c.is_active),
  }));
}

/**
 * Creates a new customer record.
 * Checks for duplicate phone numbers and returns DUPLICATE_PHONE warning
 * if found and confirmDuplicate is false.
 */
export async function createCustomerAction(
  rawInput: unknown
): Promise<ActionResult<CustomerBalance>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return auth;
  }
  const { supabase, user } = auth;

  const parsed = createCustomerSchema.safeParse(rawInput);
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
        message: "Please check the entered customer details.",
        fieldErrors,
      },
    };
  }

  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    return {
      ok: false,
      error: {
        code: "INVALID_PHONE",
        message: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
      },
    };
  }

  // Duplicate phone warning check (D-09, Section 6.4)
  if (!parsed.data.confirmDuplicate) {
    const existing = await findDuplicateCustomers(supabase, user.id, normalized);
    if (existing.length > 0) {
      return {
        ok: false,
        error: {
          code: "DUPLICATE_PHONE",
          message: `This number is already saved for ${existing[0].name}.`,
          details: {
            existing,
          },
        },
      };
    }
  }

  // Insert customer with owner_id set server-side from session user
  const { data: inserted, error: insertError } = await supabase
    .from("customers")
    .insert({
      owner_id: user.id,
      name: parsed.data.name.trim(),
      phone: normalized,
      alert_step: Number(parsed.data.alertStep),
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return handleServerError(insertError);
  }

  // Fetch full balance shape from customer_balances view
  const { data: balanceRow, error: balanceError } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("id", inserted.id)
    .single();

  if (balanceError || !balanceRow) {
    return handleServerError(balanceError);
  }

  revalidatePath("/customers");
  revalidatePath("/");

  return {
    ok: true,
    data: mapCustomerBalance(balanceRow),
  };
}

/**
 * Updates an existing customer's details.
 * Excludes the current customer id during duplicate phone checks.
 */
export async function updateCustomerAction(
  rawInput: unknown
): Promise<ActionResult<CustomerBalance>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return auth;
  }
  const { supabase, user } = auth;

  const parsed = updateCustomerSchema.safeParse(rawInput);
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
        message: "Please check the customer details.",
        fieldErrors,
      },
    };
  }

  // Verify customer exists and belongs to owner
  const { data: existingCustomer, error: findError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (findError || !existingCustomer) {
    return {
      ok: false,
      error: {
        code: "CUSTOMER_NOT_FOUND",
        message: "This customer does not exist or is not yours.",
      },
    };
  }

  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    return {
      ok: false,
      error: {
        code: "INVALID_PHONE",
        message: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
      },
    };
  }

  // Duplicate phone warning check (excluding current record)
  if (!parsed.data.confirmDuplicate) {
    const duplicates = await findDuplicateCustomers(
      supabase,
      user.id,
      normalized,
      parsed.data.id
    );
    if (duplicates.length > 0) {
      return {
        ok: false,
        error: {
          code: "DUPLICATE_PHONE",
          message: `This number is already saved for ${duplicates[0].name}.`,
          details: {
            existing: duplicates,
          },
        },
      };
    }
  }

  // Update customer
  const { error: updateError } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name.trim(),
      phone: normalized,
      alert_step: Number(parsed.data.alertStep),
    })
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id);

  if (updateError) {
    return handleServerError(updateError);
  }

  // Fetch updated customer balance from view
  const { data: balanceRow, error: balanceError } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (balanceError || !balanceRow) {
    return handleServerError(balanceError);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${parsed.data.id}`);
  revalidatePath("/");

  return {
    ok: true,
    data: mapCustomerBalance(balanceRow),
  };
}

/**
 * Sets a customer's active status (deactivate or reactivate).
 * Allowed at any balance (D-07).
 */
export async function setCustomerActiveAction(
  rawInput: unknown
): Promise<ActionResult<CustomerBalance>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return auth;
  }
  const { supabase, user } = auth;

  const parsed = setCustomerActiveSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid customer ID.",
      },
    };
  }

  // Check existence
  const { data: existingCustomer, error: findError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (findError || !existingCustomer) {
    return {
      ok: false,
      error: {
        code: "CUSTOMER_NOT_FOUND",
        message: "This customer does not exist or is not yours.",
      },
    };
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id);

  if (updateError) {
    return handleServerError(updateError);
  }

  const { data: balanceRow, error: balanceError } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (balanceError || !balanceRow) {
    return handleServerError(balanceError);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${parsed.data.id}`);
  revalidatePath("/");

  return {
    ok: true,
    data: mapCustomerBalance(balanceRow),
  };
}
