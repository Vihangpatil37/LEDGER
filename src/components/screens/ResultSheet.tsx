"use client";

import * as React from "react";
import type { CreateTransactionResult } from "@/lib/contracts/transactions";
import { formatINR, moneyToPaise, paiseToString } from "@/lib/money";
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
import { ReminderSheet } from "@/components/screens/ReminderSheet";
import { cn } from "@/components/ui/utils";

export interface ResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CreateTransactionResult | null;
  onDone: () => void;
  reminderMessage?: string;
}

export function ResultSheet({
  open,
  onOpenChange,
  result,
  onDone,
  reminderMessage = "",
}: ResultSheetProps) {
  const [showReverseForm, setShowReverseForm] = React.useState(false);
  const [reverseReason, setReverseReason] = React.useState("");
  const [reverseError, setReverseError] = React.useState<string | null>(null);
  const [isReversing, startReverseTransition] = React.useTransition();
  const [reversedBalance, setReversedBalance] = React.useState<string | null>(null);

  // Reminder sheet state
  const [reminderOpen, setReminderOpen] = React.useState(false);

  // Reset local state when opened with a new result
  React.useEffect(() => {
    if (open) {
      setShowReverseForm(false);
      setReverseReason("");
      setReverseError(null);
      setReversedBalance(null);
      setReminderOpen(false);
    }
  }, [open, result]);

  if (!result) return null;

  const { customer, transaction, balanceAfter, alert, replayed } = result;
  const isCredit = transaction.type === "CREDIT";
  const formattedAmount = formatINR(transaction.amount);

  // Line 1 copy per Section 7.6.4
  let line1Text = "";
  if (replayed) {
    line1Text = "This entry was already saved.";
  } else if (isCredit) {
    line1Text = `${formattedAmount} udhaar added for ${customer.name}.`;
  } else {
    line1Text = `${formattedAmount} payment recorded for ${customer.name}.`;
  }

  // Displayed balance (updated if reversed)
  const effectiveBalance = reversedBalance !== null ? reversedBalance : balanceAfter;
  const paise = moneyToPaise(effectiveBalance);
  const absFormatted = formatINR(paiseToString(Math.abs(paise)));

  // Balance cue
  let balanceDisplay = `Balance ${absFormatted}`;
  let balanceColor = "text-[var(--owed)]";
  if (paise < 0) {
    balanceDisplay = `Advance ${absFormatted}`;
    balanceColor = "text-[var(--paid)]";
  } else if (paise === 0) {
    balanceDisplay = "Settled";
    balanceColor = "text-[var(--ink-soft)]";
  }

  const handleClose = () => {
    onOpenChange(false);
    onDone();
  };

  const handleReverseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReverseError(null);

    const trimmed = reverseReason.trim();
    if (trimmed.length < 3 || trimmed.length > 140) {
      setReverseError("Reason must be between 3 and 140 characters.");
      return;
    }

    startReverseTransition(async () => {
      try {
        const res = await reverseTransactionAction({
          transactionId: transaction.id,
          reason: trimmed,
          idempotencyKey: crypto.randomUUID(),
        });

        if (!res.ok) {
          setReverseError(res.error.message || "Could not reverse entry.");
          return;
        }

        setReversedBalance(res.data.balanceAfter);
        setShowReverseForm(false);
      } catch {
        setReverseError("Not saved. Check your connection and try again.");
      }
    });
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(val) => {
          if (!val) {
            handleClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DrawerContent className="bg-[var(--sheet)] max-w-lg mx-auto">
          <DrawerHeader className="border-b border-[var(--rule)] pb-4 text-left">
            <DrawerTitle className="text-[18px] sm:text-[22px] font-bold text-[var(--ink)]">
              Entry saved
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4 flex flex-col gap-5">
            {/* Line 1: Entry summary */}
            <p className="text-[16px] text-[var(--ink-soft)]">
              {line1Text}
            </p>

            {/* Line 2: 32px Hero Balance */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-[14px] font-bold text-[var(--ink-soft)]">
                {customer.name}&rsquo;s balance
              </span>
              <div
                className={cn(
                  "text-[32px] font-bold tabular-nums leading-tight",
                  balanceColor
                )}
              >
                {balanceDisplay}
              </div>
            </div>

            {/* Reversal Success Notice */}
            {reversedBalance !== null && (
              <div className="p-3 bg-[var(--alert-wash)] text-[var(--alert-ink)] border border-[var(--alert-ink)]/20 text-[14px] font-bold">
                Entry reversed successfully.
              </div>
            )}

            {/* Alert Block (Section 7.6.4: if alert is present) */}
            {alert && (
              <div className="p-4 bg-[var(--alert-wash)] border border-[var(--alert-ink)]/30 rounded-[var(--radius-control)] flex flex-col gap-3">
                <p className="text-[14px] font-bold text-[var(--alert-ink)]">
                  {customer.name}&rsquo;s balance crossed ₹{formatINR(alert.crossedAmount).replace("₹", "")}.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  onClick={() => setReminderOpen(true)}
                  className="w-full font-bold bg-[var(--ink)] text-white"
                >
                  Open WhatsApp reminder
                </Button>
              </div>
            )}

            {/* Inline Reversal Form */}
            {showReverseForm && reversedBalance === null && (
              <form
                onSubmit={handleReverseSubmit}
                className="pt-3 border-t border-[var(--rule)] flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="inline-reverse-reason">
                    Reason for reversing
                  </Label>
                  <Input
                    id="inline-reverse-reason"
                    type="text"
                    value={reverseReason}
                    onChange={(e) => setReverseReason(e.target.value)}
                    placeholder="e.g. Wrong customer chosen"
                    disabled={isReversing}
                    required
                    maxLength={140}
                    autoFocus
                  />
                </div>

                {reverseError && <InlineError message={reverseError} />}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="owed"
                    size="default"
                    disabled={isReversing || reverseReason.trim().length < 3}
                    className="flex-1 font-bold"
                  >
                    {isReversing ? "Reversing…" : "Reverse entry"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled={isReversing}
                    onClick={() => setShowReverseForm(false)}
                    className="font-bold border-[var(--rule)]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>

          <DrawerFooter className="flex flex-col gap-2 pt-2 pb-6">
            <Button
              type="button"
              variant="primary"
              size="default"
              onClick={handleClose}
              className="w-full font-bold"
            >
              Done
            </Button>

            {!showReverseForm && reversedBalance === null && (
              <button
                type="button"
                onClick={() => setShowReverseForm(true)}
                className="text-[14px] text-[var(--ink-soft)] hover:text-[var(--owed)] py-2 text-center underline underline-offset-4"
              >
                Entered by mistake? Reverse it
              </button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Reminder Sheet if alert triggered */}
      {alert && (
        <ReminderSheet
          open={reminderOpen}
          onOpenChange={setReminderOpen}
          customerName={customer.name}
          phone={customer.phone}
          balance={effectiveBalance}
          defaultMessage={
            reminderMessage ||
            `Namaste ${customer.name} ji! Aapke account mein ₹${effectiveBalance} ka udhaar pending hai.`
          }
        />
      )}
    </>
  );
}
