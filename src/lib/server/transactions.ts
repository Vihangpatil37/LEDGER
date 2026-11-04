import type { LedgerEntry } from "../contracts/transactions";
import { requireUser } from "./auth";
import { mapLedgerEntry } from "./mappers";

export interface GetLedgerParams {
  customerId: string;
  before?: string;
}

/**
 * Loads the transaction ledger for a specific customer.
 * Always filters by customerId and ownerId.
 * Ordered newest first (created_at desc, id desc), page size 50.
 * Cursor pagination uses format: "<created_at>|<id>".
 */
export async function getLedger(
  params: GetLedgerParams
): Promise<{ entries: LedgerEntry[]; nextCursor: string | null }> {
  const { supabase, user } = await requireUser();
  const { customerId, before } = params;

  let query = supabase
    .from("transaction_ledger")
    .select("*")
    .eq("customer_id", customerId)
    .eq("owner_id", user.id);

  if (before && before.includes("|")) {
    const [cursorCreatedAt] = before.split("|");
    query = query.lt("created_at", cursorCreatedAt);
  }

  query = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  const { data, error } = await query;

  if (error || !data) {
    console.error("[getLedger Error]:", error?.message);
    return { entries: [], nextCursor: null };
  }

  const entries = data.map(mapLedgerEntry);
  const nextCursor =
    entries.length === 50
      ? `${entries[entries.length - 1].createdAt}|${entries[entries.length - 1].id}`
      : null;

  return {
    entries,
    nextCursor,
  };
}
