import type { CustomerBalance } from "../contracts/customers";
import { requireUser } from "./auth";
import { mapCustomerBalance } from "./mappers";

export interface ListCustomersParams {
  q?: string;
  status?: "active" | "inactive" | "all";
}

/**
 * Lists customers with their computed balances from the customer_balances view.
 * Filtered by user session (RLS via security_invoker).
 * Default status is "active".
 * Filter q matches customer name (ilike) or phone digits (like).
 * Ordered by lower(name) ascending, limit 500.
 */
export async function listCustomers(
  params: ListCustomersParams = {}
): Promise<CustomerBalance[]> {
  const { supabase } = await requireUser();
  const { q, status = "active" } = params;

  let query = supabase.from("customer_balances").select("*");

  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (q && q.trim()) {
    const rawSearch = q.trim();
    const digits = rawSearch.replace(/\D/g, "");
    if (digits.length > 0) {
      query = query.or(`name.ilike.%${rawSearch}%,phone.like.%${digits}%`);
    } else {
      query = query.ilike("name", `%${rawSearch}%`);
    }
  }

  query = query.order("name", { ascending: true }).limit(500);

  const { data, error } = await query;
  if (error || !data) {
    console.error("[listCustomers Error]:", error?.message);
    return [];
  }

  return data.map(mapCustomerBalance);
}

/**
 * Lists all customers (active and inactive) for the quick-entry picker.
 * Ordered by last_activity_at desc nulls last, lower(name) asc, limit 500.
 * Client filters inactive customers appropriately based on mode (udhaar vs payment).
 */
export async function listCustomersForPicker(): Promise<CustomerBalance[]> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("customer_balances")
    .select("*")
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(500);

  if (error || !data) {
    console.error("[listCustomersForPicker Error]:", error?.message);
    return [];
  }

  return data.map(mapCustomerBalance);
}

/**
 * Loads a single customer and their computed balance by ID.
 * Returns null if the customer does not exist or belongs to another owner.
 */
export async function getCustomer(id: string): Promise<CustomerBalance | null> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCustomerBalance(data);
}
