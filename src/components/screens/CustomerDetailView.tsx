"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import type { CustomerBalance } from "@/lib/contracts/customers";
import type { LedgerEntry, ReverseTransactionResult } from "@/lib/contracts/transactions";
import { formatPhoneDisplay, isStoredPhone } from "@/lib/phone";
import { formatINR, moneyToPaise, paiseToString } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { LedgerList } from "@/components/ledger/LedgerList";
import { ReverseSheet } from "@/components/screens/ReverseSheet";
import { ReminderSheet } from "@/components/screens/ReminderSheet";

export interface CustomerDetailViewProps {
  customer: CustomerBalance;
  ledgerEntries?: LedgerEntry[];
  initialNextCursor?: string | null;
  onLoadOlder?: (cursor: string) => Promise<{
    entries: LedgerEntry[];
    nextCursor: string | null;
  }>;
  reminderMessage?: string;
  autoOpenReminder?: boolean;
}

export function CustomerDetailView({
  customer,
  ledgerEntries = [],
  initialNextCursor = null,
  onLoadOlder,
  reminderMessage = "",
  autoOpenReminder = false,
}: CustomerDetailViewProps) {
  const router = useRouter();

  // Dynamic balance and entries state
  const [currentBalance, setCurrentBalance] = React.useState(customer.balance);
  const [entries, setEntries] = React.useState<LedgerEntry[]>(ledgerEntries);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor);
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);

  // Sync entries if initial props change
  React.useEffect(() => {
    setEntries(ledgerEntries);
    setNextCursor(initialNextCursor);
  }, [ledgerEntries, initialNextCursor]);

  // Sheets state
  const [reminderOpen, setReminderOpen] = React.useState(autoOpenReminder);
  const [reverseSheetOpen, setReverseSheetOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<LedgerEntry | null>(null);

  const paise = moneyToPaise(currentBalance);
  const isBalanceDue = paise > 0;
  const isPhoneValid = isStoredPhone(customer.phone);
  const isAdvance = paise < 0;
  const isClear = paise === 0;
  const isOwing = paise > 0;

  // Crossed alert figure: level * step
  const stepPaise = moneyToPaise(customer.alertStep);
  const crossedPaise = customer.alertLevel > 0 ? customer.alertLevel * stepPaise : stepPaise;
  const crossedFormatted = formatINR(paiseToString(crossedPaise));

  const absBalance = formatINR(paiseToString(Math.abs(paise)));
  const alertStepFormatted = formatINR(customer.alertStep);

  // Handle entry selection for reversal
  const handleSelectEntry = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setReverseSheetOpen(true);
  };

  // Handle successful reversal
  const handleReverseSuccess = (res: ReverseTransactionResult) => {
    setCurrentBalance(res.balanceAfter);

    // Update the entries list locally
    setEntries((prev) => {
      const updated = prev.map((e) =>
        e.id === res.originalId ? { ...e, isReversed: true } : e
      );

      const reversalEntry: LedgerEntry = {
        id: res.reversal.id,
        customerId: customer.id,
        customerName: customer.name,
        type: res.reversal.type,
        amount: res.reversal.amount,
        description: res.reversal.description,
        isReversal: true,
        reversalOf: res.originalId,
        isReversed: false,
        advanceConfirmed: false,
        runningBalance: res.balanceAfter,
        createdAt: res.reversal.createdAt,
      };

      return [reversalEntry, ...updated];
    });

    router.refresh();
  };

  // Cursor pagination handler
  const handleLoadOlder = async () => {
    if (!nextCursor || !onLoadOlder || isLoadingOlder) return;

    setIsLoadingOlder(true);
    try {
      const result = await onLoadOlder(nextCursor);
      setEntries((prev) => [...prev, ...result.entries]);
      setNextCursor(result.nextCursor);
    } catch {
      // Failed silently; owner can tap again
    } finally {
      setIsLoadingOlder(false);
    }
  };

  return (
    <div className="w-full min-w-0 flex flex-col gap-6">
      {/* Back to customers link */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          <span>Customers</span>
        </Link>
      </div>

      {/* Customer Header Details */}
      <div className="flex flex-col gap-1 pb-4 border-b border-[var(--rule)]">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-[var(--ink)] leading-snug">
            {customer.name}
          </h1>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="text-[14px] font-bold text-[var(--ink)] underline underline-offset-4 hover:opacity-80"
          >
            Edit
          </Link>
        </div>

        <p className="text-[16px] text-[var(--ink-soft)] tabular-nums">
          {formatPhoneDisplay(customer.phone)}
        </p>

        {/* 32px Hero Balance Line per Section 7.2 & 7.6.3 */}
        <div className="mt-3 flex flex-col items-start gap-1">
          {isOwing && (
            <div className="text-[32px] font-bold text-[var(--owed)] tabular-nums leading-tight">
              Owes {absBalance}
            </div>
          )}

          {customer.status === "ALERT" && (
            <div className="px-2.5 py-1 rounded-[var(--radius-chip)] bg-[var(--alert-wash)] text-[var(--alert-ink)] text-[14px] font-bold border border-[var(--alert-ink)]/20 tabular-nums">
              Crossed {crossedFormatted}
            </div>
          )}

          {isClear && (
            <div className="text-[32px] font-bold text-[var(--ink-soft)] leading-tight">
              Settled
            </div>
          )}

          {isAdvance && (
            <div className="text-[32px] font-bold text-[var(--paid)] tabular-nums leading-tight">
              Advance {absBalance}
            </div>
          )}

          {!customer.isActive && (
            <p className="text-[14px] font-bold text-[var(--owed)] mt-1">
              Inactive. New udhaar is blocked.
            </p>
          )}

          <p className="text-[14px] text-[var(--ink-soft)] mt-0.5 tabular-nums">
            Alert every {alertStepFormatted}
          </p>
        </div>
      </div>

      {/* Action Buttons: Add udhaar & Add payment (two 48px buttons) */}
      <div className="grid grid-cols-2 gap-3">
        {customer.isActive ? (
          <Button
            asChild
            variant="owed"
            size="default"
            className="w-full font-bold min-h-[48px]"
          >
            <Link href={`/entry?customer=${customer.id}&type=udhaar`}>
              Add udhaar
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="owed"
            size="default"
            disabled
            className="w-full font-bold min-h-[48px] opacity-40 cursor-not-allowed"
          >
            Add udhaar
          </Button>
        )}

        <Button
          asChild
          variant="paid"
          size="default"
          className="w-full font-bold min-h-[48px]"
        >
          <Link href={`/entry?customer=${customer.id}&type=payment`}>
            Add payment
          </Link>
        </Button>
      </div>

      {/* Settle Full Balance quick action if customer owes money */}
      {isBalanceDue && (
        <Button
          asChild
          variant="outline"
          size="default"
          className="w-full font-bold min-h-[48px] border-[var(--paid)] text-[var(--paid)] bg-[var(--sheet)] hover:bg-[var(--paid)]/10"
        >
          <Link href={`/entry?customer=${customer.id}&type=payment&full=1`}>
            Settle full balance ({absBalance})
          </Link>
        </Button>
      )}

      {/* WhatsApp Reminder Button */}
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={!isBalanceDue || !isPhoneValid}
          onClick={() => setReminderOpen(true)}
          className="w-full font-bold min-h-[48px] border-[var(--rule)] bg-[var(--sheet)] flex items-center justify-center gap-2"
        >
          <MessageSquare size={18} strokeWidth={1.75} />
          <span>Send WhatsApp reminder</span>
        </Button>

        {/* Visible reasons beneath when disabled per Section 7.6.3 */}
        {!isBalanceDue && (
          <p className="text-[14px] text-[var(--ink-soft)] text-center">
            Nothing is due.
          </p>
        )}

        {isBalanceDue && !isPhoneValid && (
          <p className="text-[14px] text-[var(--owed)] text-center">
            Fix the mobile number to send a reminder.{" "}
            <Link
              href={`/customers/${customer.id}/edit`}
              className="underline underline-offset-4 font-bold"
            >
              Edit
            </Link>
          </p>
        )}
      </div>

      {/* Ledger Section (Khata double red margin rule with day grouping & pagination) */}
      <section className="mt-4 flex flex-col gap-3 min-w-0" aria-labelledby="ledger-title">
        <div className="flex items-center justify-between">
          <h2 id="ledger-title" className="text-[18px] font-bold text-[var(--ink)]">
            Ledger (khata)
          </h2>
        </div>

        <LedgerList
          entries={entries}
          onSelectEntry={handleSelectEntry}
          onLoadOlder={handleLoadOlder}
          hasMore={Boolean(nextCursor)}
          isLoadingOlder={isLoadingOlder}
        />
      </section>

      {/* Reminder Sheet */}
      <ReminderSheet
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        customerName={customer.name}
        phone={customer.phone}
        balance={currentBalance}
        defaultMessage={reminderMessage}
      />

      {/* Reverse Sheet */}
      <ReverseSheet
        open={reverseSheetOpen}
        onOpenChange={setReverseSheetOpen}
        entry={selectedEntry}
        onSuccess={handleReverseSuccess}
      />
    </div>
  );
}
