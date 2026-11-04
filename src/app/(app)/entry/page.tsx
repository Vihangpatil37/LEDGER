import * as React from "react";
import { listCustomersForPicker } from "@/lib/server/customers";
import { getSettings } from "@/lib/server/settings";
import { EntryView } from "@/components/screens/EntryView";

interface EntryPageProps {
  searchParams: Promise<{
    type?: "udhaar" | "payment";
    customer?: string;
  }>;
}

export default async function EntryPage({ searchParams }: EntryPageProps) {
  const resolvedParams = await searchParams;
  const initialType = resolvedParams.type === "payment" ? "payment" : "udhaar";
  const initialCustomerId = resolvedParams.customer || "";

  const [customers, settings] = await Promise.all([
    listCustomersForPicker(),
    getSettings().catch(() => null),
  ]);

  return (
    <React.Suspense
      fallback={
        <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
          <div className="h-12 bg-[var(--rule)]/20 rounded-[var(--radius-control)]" />
          <div className="h-14 bg-[var(--rule)]/30 rounded-[var(--radius-control)]" />
          <div className="h-32 bg-[var(--rule)]/20 rounded-[var(--radius-control)]" />
        </div>
      }
    >
      <EntryView
        customers={customers}
        initialType={initialType}
        initialCustomerId={initialCustomerId}
        reminderTemplate={settings?.reminderTemplate}
        shopName={settings?.shopName}
      />
    </React.Suspense>
  );
}
