import type { DashboardSummary } from "../contracts/dashboard";
import { requireUser } from "./auth";
import { mapCustomerBalance, mapDashboardSummary, mapLedgerEntry } from "./mappers";

/**
 * Loads the dashboard summary, needs-a-reminder alert customers, and recent transactions.
 * Calls the atomic dashboard_summary() RPC function, customer_balances view, and transaction_ledger view.
 */
export async function getDashboard(): Promise<DashboardSummary> {
  const { supabase, user } = await requireUser();

  // 1. Call dashboard_summary RPC
  const { data: summaryData, error: summaryError } = await supabase.rpc(
    "dashboard_summary"
  );
  if (summaryError) {
    console.error("[getDashboard summaryError]:", summaryError.message);
  }

  // 2. Query customer_balances for alert customers: status = 'ALERT', ordered by balance desc, limit 20
  const { data: alertRows, error: alertError } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("status", "ALERT")
    .order("balance", { ascending: false })
    .limit(20);
  if (alertError) {
    console.error("[getDashboard alertError]:", alertError.message);
  }

  // 3. Query transaction_ledger for recent entries: owner_id = user.id, ordered by created_at desc, id desc, limit 10
  const { data: recentRows, error: recentError } = await supabase
    .from("transaction_ledger")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10);
  if (recentError) {
    console.error("[getDashboard recentError]:", recentError.message);
  }

  const needsReminder = (alertRows || []).map(mapCustomerBalance);
  const recent = (recentRows || []).map(mapLedgerEntry);

  return mapDashboardSummary(summaryData || {}, needsReminder, recent);
}
