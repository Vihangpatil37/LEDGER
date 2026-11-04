import { CustomerBalance } from "./customers";
import { LedgerEntry } from "./transactions";

export type DashboardSummary = {
  totalOutstanding: string;
  totalAdvance: string;
  activeCustomers: number;
  alertCustomers: number;
  creditToday: string;
  paymentsToday: string;
  needsReminder: CustomerBalance[]; // status ALERT, sorted by balance desc, max 20
  recent: LedgerEntry[]; // latest 10 across customers
};
