"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import type { CustomerBalance } from "@/lib/contracts/customers";
import { formatPhoneDisplay } from "@/lib/phone";
import { BalanceLine } from "@/components/ledger/BalanceLine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/components/ui/utils";

export interface CustomerListViewProps {
  customers: CustomerBalance[];
  initialQuery?: string;
  initialStatus?: "active" | "inactive" | "all";
}

export function CustomerListView({
  customers,
  initialQuery = "",
  initialStatus = "active",
}: CustomerListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(initialQuery);
  const currentStatus = (searchParams.get("status") as "active" | "inactive" | "all") || initialStatus;

  // Debounced URL sync (200ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (query.trim() !== currentQ.trim()) {
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
          params.set("q", query.trim());
        } else {
          params.delete("q");
        }
        router.replace(`/customers?${params.toString()}`);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  const handleStatusChange = (newStatus: "active" | "inactive" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", newStatus);
    if (query.trim()) {
      params.set("q", query.trim());
    }
    router.replace(`/customers?${params.toString()}`);
  };

  const hasSearch = Boolean(query.trim());
  const isEmpty = customers.length === 0;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Top Header: Title and Add Customer button */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold text-[var(--ink)]">
          Customers
        </h1>
        <Button asChild variant="primary" size="default" className="font-bold">
          <Link href="/customers/new" className="flex items-center gap-1.5">
            <Plus size={18} strokeWidth={2} />
            <span>Add customer</span>
          </Link>
        </Button>
      </div>

      {/* Search Input & Filter Segmented Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--ink-soft)]">
            <Search size={18} strokeWidth={1.75} />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or mobile number"
            className="pl-10 min-h-[48px] bg-[var(--sheet)]"
            aria-label="Search customers"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div
          role="radiogroup"
          aria-label="Customer status filter"
          className="inline-flex p-1 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)] shrink-0"
        >
          {(["active", "inactive", "all"] as const).map((statusKey) => {
            const isSelected = currentStatus === statusKey;
            const label =
              statusKey === "active"
                ? "Active"
                : statusKey === "inactive"
                ? "Inactive"
                : "All";

            return (
              <button
                key={statusKey}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleStatusChange(statusKey)}
                className={cn(
                  "min-h-[40px] px-3.5 py-1.5 text-[14px] font-bold rounded-[calc(var(--radius-control)-4px)] transition-colors text-center capitalize",
                  isSelected
                    ? "bg-[var(--ink)] text-white shadow-none"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer List as Ruled Rows (NO CARDS per Section 7.3) */}
      {!isEmpty && (
        <div className="bg-[var(--sheet)] border border-[var(--rule)] divide-y divide-[var(--rule)]">
          {customers.map((cust) => (
            <Link
              key={cust.id}
              href={`/customers/${cust.id}`}
              className="px-4 py-3.5 min-h-[56px] flex items-center justify-between gap-4 hover:bg-[var(--paper)]/60 active:scale-[0.99] transition-transform text-left"
            >
              {/* Left Column: Name (18px bold) and Formatted Phone */}
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[18px] font-bold text-[var(--ink)] leading-snug truncate">
                  {cust.name}
                </span>
                <span className="text-[14px] text-[var(--ink-soft)] mt-0.5">
                  {formatPhoneDisplay(cust.phone)}
                </span>
              </div>

              {/* Right Column: Balance with required status word cues */}
              <div className="text-right shrink-0">
                <BalanceLine
                  status={cust.status}
                  balance={cust.balance}
                  alertStep={cust.alertStep}
                  alertLevel={cust.alertLevel}
                  isActive={cust.isActive}
                  compact
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty States adhering strictly to Section 7.8 */}
      {isEmpty && (
        hasSearch ? (
          <EmptyState
            title={`No customer matches "${query.trim()}".`}
            className="border border-[var(--rule)]"
          />
        ) : (
          <EmptyState
            title="No customers yet. Add your first customer to start recording udhaar."
            action={
              <Button asChild variant="primary" size="default" className="font-bold">
                <Link href="/customers/new">Add customer</Link>
              </Button>
            }
            className="border border-[var(--rule)]"
          />
        )
      )}
    </div>
  );
}
