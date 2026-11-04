"use client";

import React from "react";
import type { LedgerEntry } from "@/lib/contracts/transactions";
import { formatIST } from "@/lib/ist";
import { formatINR } from "@/lib/money";
import { cn } from "@/components/ui/utils";

export interface LedgerRowProps {
  entry: LedgerEntry;
  compact?: boolean;
  onSelect?: (entry: LedgerEntry) => void;
  className?: string;
}

/**
 * LedgerRow component adhering strictly to Section 7.6.3 & 7.7:
 * - Left column: IST time, note/description (or customer name if compact).
 * - Reversed original: amount struck through, "Reversed" displayed beneath note.
 * - Reversal row: displays "Reversal: <reason>".
 * - Right column: "Udhaar ₹X" in --owed or "Paid ₹X" in --paid.
 * - Running balance displayed below amount in 14px --ink-soft.
 * - Advance payments show "Advance" under the amount.
 * - Minimum 48px touch target.
 */
export function LedgerRow({
  entry,
  compact = false,
  onSelect,
  className,
}: LedgerRowProps) {
  const timeStr = formatIST(entry.createdAt, "time");
  const formattedAmount = formatINR(entry.amount);
  const formattedBalance = formatINR(entry.runningBalance);

  // Label text for transaction type
  const isCredit = entry.type === "CREDIT";
  const amountPrefix = isCredit ? "Udhaar " : "Paid ";

  // Note rendering logic
  let noteText = entry.description;
  if (entry.isReversal) {
    noteText = entry.description ? `Reversal: ${entry.description}` : "Reversal";
  } else if (!noteText) {
    noteText = isCredit ? "Udhaar" : "Payment";
  }

  const handleClick = () => {
    if (onSelect) {
      onSelect(entry);
    }
  };

  const isInteractive = Boolean(onSelect);

  return (
    <div
      onClick={isInteractive ? handleClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      className={cn(
        "w-full min-h-[48px] py-3 px-4 flex items-center justify-between gap-3 text-left transition-colors border-b border-[var(--rule)] last:border-b-0",
        isInteractive &&
          "cursor-pointer hover:bg-[var(--paper)]/60 active:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]",
        className
      )}
    >
      {/* Left Column: Time & Note / Customer Name */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-[var(--ink-soft)] tabular-nums shrink-0">
            {timeStr}
          </span>
          {compact && (
            <span className="text-[16px] font-bold text-[var(--ink)] truncate">
              {entry.customerName}
            </span>
          )}
        </div>

        <p className="text-[16px] text-[var(--ink)] font-bold truncate mt-0.5">
          {noteText}
        </p>

        {entry.isReversed && (
          <span className="text-[12px] font-bold text-[var(--ink-soft)] block mt-0.5">
            Reversed
          </span>
        )}
      </div>

      {/* Right Column: Amount & Running Balance */}
      <div className="shrink-0 text-right tabular-nums">
        {entry.isReversed ? (
          <span className="text-[16px] font-bold line-through text-[var(--ink-soft)] block">
            {amountPrefix}
            {formattedAmount}
          </span>
        ) : (
          <span
            className={cn(
              "text-[16px] font-bold block",
              isCredit ? "text-[var(--owed)]" : "text-[var(--paid)]"
            )}
          >
            {amountPrefix}
            {formattedAmount}
          </span>
        )}

        <span className="text-[14px] text-[var(--ink-soft)] block mt-0.5">
          Balance {formattedBalance}
        </span>

        {entry.advanceConfirmed && (
          <span className="text-[12px] font-bold text-[var(--paid)] block mt-0.5">
            Advance
          </span>
        )}
      </div>
    </div>
  );
}
