"use server";

import type { ActionResult } from "@/lib/contracts/common";
import {
  type CreateTransactionResult,
  createTransactionSchema,
} from "@/lib/contracts/transactions";
import { safeRequireUser } from "@/lib/server/auth";
import { handleServerError } from "@/lib/server/errors";
import { mapCreateTransactionResult } from "@/lib/server/mappers";
import { revalidatePath } from "next/cache";

/**
 * Creates an udhaar or payment transaction via the atomic create_transaction RPC.
 * Enforces idempotency via idempotencyKey.
 * Requires advance payment confirmation if payment > balance.
 * Blocks credit to inactive customers.
 */
export async function createTransactionAction(
  rawInput: unknown
): Promise<ActionResult<CreateTransactionResult>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return auth;
  }
  const { supabase } = auth;

  const parsed = createTransactionSchema.safeParse(rawInput);
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
        message: "Please check transaction details.",
        fieldErrors,
      },
    };
  }

  const {
    customerId,
    type,
    amount,
    description,
    idempotencyKey,
    confirmAdvance,
  } = parsed.data;

  try {
    const { data, error } = await supabase.rpc("create_transaction", {
      p_customer_id: customerId,
      p_type: type,
      p_amount: amount,
      p_description: description,
      p_idempotency_key: idempotencyKey,
      p_confirm_advance: confirmAdvance,
    });

    if (error) {
      return handleServerError(error);
    }

    const result = mapCreateTransactionResult(data);

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return {
      ok: true,
      data: result,
    };
  } catch (err) {
    return handleServerError(err);
  }
}
