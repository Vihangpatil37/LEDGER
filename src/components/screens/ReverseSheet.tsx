"use client";

import * as React from "react";
import type { LedgerEntry, ReverseTransactionResult } from "@/lib/contracts/transactions";
import { formatIST } from "@/lib/ist";
import { formatINR } from "@/lib/money";
import { reverseTransactionAction } from "@/app/(app)/customers/[id]/actions";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";

export interface ReverseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LedgerEntry | null;
  onSuccess?: (result: ReverseTransactionResult) => void;
}

/**
 * ReverseSheet adhering strictly to Section 7.6.3 & 7.6.4:
 * - Shows full entry details: IST date/time, amount, note, type, running balance.
 * - Reversal form: Reason (3..140 characters, label "Reason for reversing" per 7.8), button "Reverse entry".
 * - If already reversed or is a reversal: explains why it cannot be reversed; reversal button hidden.
 * - On success: refreshes ledger and notifies caller.
 */
export function ReverseSheet({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: ReverseSheetProps) {
  const [reason, setReason] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [successResult, setSuccessResult] = React.useState<ReverseTransactionResult | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setErrorMessage(null);
      setSuccessResult(null);
    }
  }, [open, entry]);

  if (!entry) return null;

  const isCredit = entry.type === "CREDIT";
  const cannotReverse = entry.isReversal || entry.isReversed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = reason.trim();
    if (trimmed.length < 3 || trimmed.length > 140) {
      setErrorMessage("Reason must be between 3 and 140 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await reverseTransactionAction({
          transactionId: entry.id,
          reason: trimmed,
          idempotencyKey: crypto.randomUUID(),
        });

        if (!result.ok) {
          setErrorMessage(result.error.message || "Could not reverse entry.");
          return;
        }

        setSuccessResult(result.data);
        onSuccess?.(result.data);
      } catch {
        setErrorMessage("Not saved. Check your connection and try again.");
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[var(--sheet)] max-w-lg mx-auto">
        <DrawerHeader className="border-b border-[var(--rule)] pb-4 text-left">
          <DrawerTitle className="text-[18px] sm:text-[22px] font-bold text-[var(--ink)]">
            Entry details
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 flex flex-col gap-4">
          {/* Entry figures list */}
          <dl className="border border-[var(--rule)] divide-y divide-[var(--rule)] bg-[var(--sheet)]">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <dt className="text-[14px] text-[var(--ink-soft)]">Type</dt>
              <dd className="text-[14px] font-bold text-[var(--ink)]">
                {isCredit ? "Udhaar" : "Payment"}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <dt className="text-[14px] text-[var(--ink-soft)]">Amount</dt>
              <dd
                className={`text-[16px] font-bold tabular-nums ${
                  isCredit ? "text-[var(--owed)]" : "text-[var(--paid)]"
                }`}
              >
                {formatINR(entry.amount)}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <dt className="text-[14px] text-[var(--ink-soft)]">Time</dt>
              <dd className="text-[14px] text-[var(--ink-soft)] tabular-nums">
                {formatIST(entry.createdAt, "datetime")}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <dt className="text-[14px] text-[var(--ink-soft)]">Note</dt>
              <dd className="text-[14px] font-bold text-[var(--ink)]">
                {entry.description || "—"}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <dt className="text-[14px] text-[var(--ink-soft)]">Balance after</dt>
              <dd className="text-[14px] font-bold text-[var(--ink)] tabular-nums">
                {formatINR(entry.runningBalance)}
              </dd>
            </div>
          </dl>

          {/* Success state */}
          {successResult && (
            <div className="p-4 bg-[var(--alert-wash)] text-[var(--alert-ink)] border border-[var(--alert-ink)]/20 rounded-[var(--radius-control)]">
              <p className="font-bold">Entry reversed.</p>
              <p className="text-[14px] mt-1 tabular-nums">
                New balance: {formatINR(successResult.balanceAfter)}
              </p>
            </div>
          )}

          {/* If already reversed or is a reversal */}
          {cannotReverse && !successResult && (
            <div className="p-3 bg-[var(--paper)] text-[var(--ink-soft)] text-[14px] border border-[var(--rule)]">
              {entry.isReversal
                ? "Reversal entries cannot be reversed."
                : "This entry was already reversed."}
            </div>
          )}

          {/* Reversal form */}
          {!cannotReverse && !successResult && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                {/* Section 7.8 verbatim: "Reason for reversing" */}
                <Label htmlFor="reverse-reason">
                  Reason for reversing
                </Label>
                <Input
                  id="reverse-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Wrong amount entered"
                  disabled={isPending}
                  required
                  maxLength={140}
                  error={!!errorMessage}
                />
              </div>

              {errorMessage && <InlineError message={errorMessage} />}

              <Button
                type="submit"
                variant="owed"
                size="default"
                disabled={isPending || reason.trim().length < 3}
                className="w-full font-bold"
              >
                {isPending ? "Saving…" : "Reverse entry"}
              </Button>
            </form>
          )}
        </div>

        <DrawerFooter className="pt-2 pb-6">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
            className="w-full font-bold border-[var(--rule)]"
          >
            {successResult ? "Done" : "Close"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
