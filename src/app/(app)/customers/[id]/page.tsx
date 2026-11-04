import * as React from "react";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/server/customers";
import { getLedger } from "@/lib/server/transactions";
import { getReminderDraft } from "@/lib/server/reminders";
import { CustomerDetailView } from "@/components/screens/CustomerDetailView";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ openReminder?: string }>;
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const customer = await getCustomer(id);
  if (!customer) {
    notFound();
  }

  const [ledgerRes, reminderRes] = await Promise.all([
    getLedger({ customerId: id }).catch(() => ({ entries: [], nextCursor: null })),
    getReminderDraft(id).catch(() => null),
  ]);

  const defaultReminderMessage =
    reminderRes && reminderRes.ok ? reminderRes.data.message : "";

  // Server action for pagination passed to client component
  async function handleLoadOlder(cursor: string) {
    "use server";
    return getLedger({ customerId: id, before: cursor });
  }

  return (
    <CustomerDetailView
      customer={customer}
      ledgerEntries={ledgerRes.entries}
      initialNextCursor={ledgerRes.nextCursor}
      onLoadOlder={handleLoadOlder}
      reminderMessage={defaultReminderMessage}
      autoOpenReminder={resolvedSearchParams.openReminder === "1"}
    />
  );
}
