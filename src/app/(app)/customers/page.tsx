import * as React from "react";
import { listCustomers } from "@/lib/server/customers";
import { CustomerListView } from "@/components/screens/CustomerListView";

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: "active" | "inactive" | "all";
  }>;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const status = resolvedParams.status || "active";

  const customers = await listCustomers({ q, status });

  return (
    <React.Suspense
      fallback={
        <div className="w-full flex flex-col gap-4">
          <div className="h-8 w-40 bg-[var(--rule)]/40 rounded-[var(--radius-chip)]" />
          <div className="h-12 w-full bg-[var(--rule)]/20 rounded-[var(--radius-control)]" />
        </div>
      }
    >
      <CustomerListView
        customers={customers}
        initialQuery={q}
        initialStatus={status}
      />
    </React.Suspense>
  );
}
