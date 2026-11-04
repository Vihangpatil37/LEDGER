"use server";

import type { ActionResult } from "@/lib/contracts/common";
import {
  type ReverseTransactionResult,
  reverseTransactionSchema,
} from "@/lib/contracts/transactions";
import { safeRequireUser } from "@/lib/server/auth";
import { handleServerError } from "@/lib/server/errors";
import { mapReverseTransactionResult } from "@/lib/server/mappers";
import { revalidatePath } from "next/cache";

/**
 * Reverses a ledger transaction via the atomic reverse_transaction RPC.
 * Creates an opposite entry linked to the original.
 * Original entry is struck through; reversals cannot be reversed.
 */
export async function reverseTransactionAction(
  rawInput: unknown
): Promise<ActionResult<ReverseTransactionResult>> {
  const auth = await safeRequireUser();
  if (!auth.ok) {
    return auth;
  }
  const { supabase } = auth;

  const parsed = reverseTransactionSchema.safeParse(rawInput);
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
        message: "Reason must be between 3 and 140 characters.",
        fieldErrors,
      },
    };
  }

  const { transactionId, reason, idempotencyKey } = parsed.data;

  try {
    const { data, error } = await supabase.rpc("reverse_transaction", {
      p_transaction_id: transactionId,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      return handleServerError(error);
    }

    const result = mapReverseTransactionResult(data);

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath("/customers/[id]", "page");

    return {
      ok: true,
      data: result,
    };
  } catch (err) {
    return handleServerError(err);
  }
}
