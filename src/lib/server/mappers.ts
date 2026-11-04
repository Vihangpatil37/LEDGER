import type { CustomerBalance, CustomerStatus } from "../contracts/customers";
import type { DashboardSummary } from "../contracts/dashboard";
import type { Settings } from "../contracts/settings";
import type {
  CreateTransactionResult,
  LedgerEntry,
  ReverseTransactionResult,
} from "../contracts/transactions";

/**
 * Converts a numeric value (from DB views or calculations) to a strict two-decimal string.
 * Example: 50 -> "50.00", "1250.5" -> "1250.50", null -> "0.00".
 */
export function formatAmount(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") {
    return "0.00";
  }
  const num = typeof val === "number" ? val : Number(val);
  if (Number.isNaN(num)) {
    return "0.00";
  }
  return num.toFixed(2);
}

/**
 * Maps a raw customer_balances DB view row to CustomerBalance contract.
 */
export function mapCustomerBalance(raw: {
  id: string;
  name: string;
  phone: string;
  alert_step: number | string;
  is_active: boolean;
  balance: number | string;
  status: CustomerStatus;
  alert_level: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}): CustomerBalance {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    alertStep: formatAmount(raw.alert_step),
    isActive: Boolean(raw.is_active),
    balance: formatAmount(raw.balance),
    status: raw.status,
    alertLevel: Number(raw.alert_level) || 0,
    lastActivityAt: raw.last_activity_at ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Maps a raw transaction_ledger DB view row to LedgerEntry contract.
 */
export function mapLedgerEntry(raw: {
  id: string;
  customer_id: string;
  customer_name: string;
  type: "CREDIT" | "PAYMENT";
  amount: number | string;
  description: string | null;
  is_reversal: boolean;
  reversal_of: string | null;
  is_reversed: boolean;
  advance_confirmed: boolean;
  running_balance: number | string;
  created_at: string;
}): LedgerEntry {
  return {
    id: raw.id,
    customerId: raw.customer_id,
    customerName: raw.customer_name,
    type: raw.type,
    amount: formatAmount(raw.amount),
    description: raw.description ?? null,
    isReversal: Boolean(raw.is_reversal),
    reversalOf: raw.reversal_of ?? null,
    isReversed: Boolean(raw.is_reversed),
    advanceConfirmed: Boolean(raw.advance_confirmed),
    runningBalance: formatAmount(raw.running_balance),
    createdAt: raw.created_at,
  };
}

/**
 * Maps create_transaction RPC jsonb response to CreateTransactionResult contract.
 */
export function mapCreateTransactionResult(rpcData: any): CreateTransactionResult {
  return {
    replayed: Boolean(rpcData.replayed),
    transaction: {
      id: rpcData.transaction.id,
      type: rpcData.transaction.type,
      amount: formatAmount(rpcData.transaction.amount),
      description: rpcData.transaction.description ?? null,
      createdAt: rpcData.transaction.created_at ?? rpcData.transaction.createdAt,
    },
    customer: {
      id: rpcData.customer.id,
      name: rpcData.customer.name,
      phone: rpcData.customer.phone,
      alertStep: formatAmount(rpcData.customer.alert_step ?? rpcData.customer.alertStep),
    },
    balanceBefore:
      rpcData.balance_before !== null && rpcData.balance_before !== undefined
        ? formatAmount(rpcData.balance_before)
        : rpcData.balanceBefore
        ? formatAmount(rpcData.balanceBefore)
        : null,
    balanceAfter: formatAmount(rpcData.balance_after ?? rpcData.balanceAfter),
    alert: rpcData.alert
      ? {
          level: Number(rpcData.alert.level),
          crossedAmount: formatAmount(
            rpcData.alert.crossed_amount ?? rpcData.alert.crossedAmount
          ),
        }
      : null,
  };
}

/**
 * Maps reverse_transaction RPC jsonb response to ReverseTransactionResult contract.
 */
export function mapReverseTransactionResult(rpcData: any): ReverseTransactionResult {
  return {
    replayed: Boolean(rpcData.replayed),
    originalId: rpcData.original_id ?? rpcData.originalId,
    balanceAfter: formatAmount(rpcData.balance_after ?? rpcData.balanceAfter),
    reversal: {
      id: rpcData.reversal.id,
      type: rpcData.reversal.type,
      amount: formatAmount(rpcData.reversal.amount),
      description: rpcData.reversal.description,
      createdAt: rpcData.reversal.created_at ?? rpcData.reversal.createdAt,
    },
  };
}

/**
 * Maps dashboard_summary RPC response + alerts and recent ledger to DashboardSummary contract.
 */
export function mapDashboardSummary(
  rpcData: {
    total_outstanding?: number | string;
    total_advance?: number | string;
    active_customers?: number;
    alert_customers?: number;
    credit_today?: number | string;
    payments_today?: number | string;
  },
  needsReminder: CustomerBalance[],
  recent: LedgerEntry[]
): DashboardSummary {
  return {
    totalOutstanding: formatAmount(rpcData.total_outstanding),
    totalAdvance: formatAmount(rpcData.total_advance),
    activeCustomers: Number(rpcData.active_customers) || 0,
    alertCustomers: Number(rpcData.alert_customers) || 0,
    creditToday: formatAmount(rpcData.credit_today),
    paymentsToday: formatAmount(rpcData.payments_today),
    needsReminder,
    recent,
  };
}

/**
 * Maps profiles DB row to Settings contract.
 */
export function mapSettings(raw: {
  shop_name?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  default_alert_step?: number | string;
  reminder_template?: string;
}): Settings {
  return {
    shopName: raw.shop_name ?? null,
    ownerName: raw.owner_name ?? null,
    phone: raw.phone ?? null,
    defaultAlertStep: formatAmount(raw.default_alert_step ?? 500),
    reminderTemplate: raw.reminder_template ?? "",
  };
}
