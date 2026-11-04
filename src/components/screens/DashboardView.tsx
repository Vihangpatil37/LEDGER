"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { renderReminder, DEFAULT_REMINDER_TEMPLATE } from "@/lib/reminder";
import type { DashboardSummary } from "@/lib/contracts/dashboard";
import type { CustomerBalance } from "@/lib/contracts/customers";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReminderSheet } from "@/components/screens/ReminderSheet";

export interface DashboardViewProps {
  data: DashboardSummary;
  reminderTemplate?: string;
  shopName?: string | null;
}

export function DashboardView({
  data,
  reminderTemplate = DEFAULT_REMINDER_TEMPLATE,
  shopName = null,
}: DashboardViewProps) {
  const hasReminders = data.needsReminder && data.needsReminder.length > 0;
  const hasRecent = data.recent && data.recent.length > 0;
  const showAdvance =
    data.totalAdvance && data.totalAdvance !== "0.00" && data.totalAdvance !== "0";

  // Reminder sheet state for direct action from Dashboard
  const [activeCustomer, setActiveCustomer] = React.useState<CustomerBalance | null>(null);
  const [reminderOpen, setReminderOpen] = React.useState(false);

  const handleOpenReminder = (customer: CustomerBalance) => {
    setActiveCustomer(customer);
    setReminderOpen(true);
  };

  const currentReminderMessage = React.useMemo(() => {
    if (!activeCustomer) return "";
    return renderReminder(reminderTemplate, {
      name: activeCustomer.name,
      amount: activeCustomer.balance,
      shop: shopName,
    });
  }, [activeCustomer, reminderTemplate, shopName]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Quick Actions: Add udhaar & Add payment (two 56px buttons) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Button
          asChild
          variant="owed"
          size="save"
          className="text-[18px] font-bold"
        >
          <Link href="/entry?type=udhaar">Add udhaar</Link>
        </Button>
        <Button
          asChild
          variant="paid"
          size="save"
          className="text-[18px] font-bold"
        >
          <Link href="/entry?type=payment">Add payment</Link>
        </Button>
      </div>

      {/* Main Grid: On desktop (lg+) columns: left (Needs a reminder, Recent entries), right 320px (Today, All customers) */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Needs a reminder */}
          <section aria-labelledby="needs-reminder-title">
            <div className="flex items-center justify-between pb-2">
              <h2
                id="needs-reminder-title"
                className="text-[18px] font-bold text-[var(--ink)]"
              >
                Needs a reminder{hasReminders ? ` (${data.needsReminder.length})` : ""}
              </h2>
            </div>

            {hasReminders ? (
              <div className="bg-[var(--alert-wash)] border border-[var(--rule)] divide-y divide-[var(--rule)]">
                {data.needsReminder.map((customer) => {
                  const alertStepNum = parseFloat(customer.alertStep) || 500;
                  const crossedAmount = (customer.alertLevel * alertStepNum).toFixed(0);

                  return (
                    <div
                      key={customer.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/customers/${customer.id}`}
                        className="flex-1 flex flex-col hover:opacity-80 transition-opacity"
                      >
                        <span className="text-[16px] font-bold text-[var(--ink)]">
                          {customer.name}
                        </span>
                        <span className="text-[14px] text-[var(--alert-ink)]">
                          Crossed ₹{crossedAmount}
                        </span>
                      </Link>

                      <div className="flex items-center gap-3">
                        <span className="text-[16px] font-bold text-[var(--owed)] tabular-nums">
                          {formatINR(customer.balance)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReminder(customer)}
                          className="font-bold border-[var(--rule)] bg-[var(--sheet)]"
                        >
                          Remind
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[var(--sheet)] border border-[var(--rule)] p-6 text-center">
                {/* Section 7.6.1 copy verbatim */}
                <p className="text-[14px] text-[var(--ink-soft)]">
                  No customer has crossed their alert step.
                </p>
              </div>
            )}
          </section>

          {/* Recent entries */}
          <section aria-labelledby="recent-entries-title">
            <div className="pb-2">
              <h2
                id="recent-entries-title"
                className="text-[18px] font-bold text-[var(--ink)]"
              >
                Recent entries
              </h2>
            </div>

            {hasRecent ? (
              <div className="bg-[var(--sheet)] border border-[var(--rule)] divide-y divide-[var(--rule)]">
                {data.recent.map((entry) => {
                  const isCredit = entry.type === "CREDIT";
                  return (
                    <Link
                      key={entry.id}
                      href={`/customers/${entry.customerId}`}
                      className="px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--paper)]/60 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-[var(--ink)]">
                          {entry.customerName || "Customer"}
                        </span>
                        <span className="text-[14px] text-[var(--ink-soft)]">
                          {entry.description || (isCredit ? "Udhaar" : "Payment")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[16px] font-bold tabular-nums ${
                            isCredit ? "text-[var(--owed)]" : "text-[var(--paid)]"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatINR(entry.amount)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No entries yet." />
            )}
          </section>
        </div>

        {/* Right Column (desktop lg+ 320px) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
          {/* Today */}
          <section aria-labelledby="today-title">
            <div className="pb-2">
              <h2
                id="today-title"
                className="text-[18px] font-bold text-[var(--ink)]"
              >
                Today
              </h2>
            </div>
            <dl className="bg-[var(--sheet)] border border-[var(--rule)] divide-y divide-[var(--rule)]">
              <div className="px-4 py-3 flex items-center justify-between">
                <dt className="text-[16px] text-[var(--ink-soft)]">Udhaar given</dt>
                <dd className="text-[16px] font-bold text-[var(--owed)] tabular-nums">
                  {formatINR(data.creditToday)}
                </dd>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <dt className="text-[16px] text-[var(--ink-soft)]">Payments received</dt>
                <dd className="text-[16px] font-bold text-[var(--paid)] tabular-nums">
                  {formatINR(data.paymentsToday)}
                </dd>
              </div>
            </dl>
          </section>

          {/* All customers */}
          <section aria-labelledby="all-customers-title">
            <div className="pb-2">
              <h2
                id="all-customers-title"
                className="text-[18px] font-bold text-[var(--ink)]"
              >
                All customers
              </h2>
            </div>
            <dl className="bg-[var(--sheet)] border border-[var(--rule)] divide-y divide-[var(--rule)]">
              <div className="px-4 py-3 flex items-center justify-between">
                <dt className="text-[16px] text-[var(--ink-soft)]">Total outstanding</dt>
                <dd className="text-[16px] font-bold text-[var(--owed)] tabular-nums">
                  {formatINR(data.totalOutstanding)}
                </dd>
              </div>

              {/* Advance held (hidden when 0 per 7.6.1) */}
              {showAdvance && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <dt className="text-[16px] text-[var(--ink-soft)]">Advance held</dt>
                  <dd className="text-[16px] font-bold text-[var(--paid)] tabular-nums">
                    {formatINR(data.totalAdvance)}
                  </dd>
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between">
                <dt className="text-[16px] text-[var(--ink-soft)]">Active customers</dt>
                <dd className="text-[16px] font-bold text-[var(--ink)] tabular-nums">
                  {data.activeCustomers}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {/* Reminder Sheet for Direct Reminder from Dashboard */}
      {activeCustomer && (
        <ReminderSheet
          open={reminderOpen}
          onOpenChange={setReminderOpen}
          customerName={activeCustomer.name}
          phone={activeCustomer.phone}
          balance={activeCustomer.balance}
          defaultMessage={currentReminderMessage}
        />
      )}
    </div>
  );
}
