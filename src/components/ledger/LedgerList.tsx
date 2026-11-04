"use client";

import React, { useMemo } from "react";
import type { LedgerEntry } from "@/lib/contracts/transactions";
import { dayLabelIST, formatIST } from "@/lib/ist";
import { formatINR } from "@/lib/money";
import { LedgerRow } from "@/components/ledger/LedgerRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

export interface LedgerListProps {
  entries: LedgerEntry[];
  onSelectEntry?: (entry: LedgerEntry) => void;
  onLoadOlder?: () => void;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  className?: string;
}

/**
 * LedgerList component adhering to Section 7.6.3 & 7.7:
 * - Day grouping via dayLabelIST ("Today", "Yesterday", "4 Nov").
 * - Khata double vertical margin rule on the white sheet (.khata-margin).
 * - Hairline dividers between rows.
 * - Mobile ruled rows + Desktop 5-column table variant (Date, Note, Udhaar, Paid, Balance).
 * - "Load older entries" pagination trigger.
 */
export function LedgerList({
  entries,
  onSelectEntry,
  onLoadOlder,
  hasMore = false,
  isLoadingOlder = false,
  className,
}: LedgerListProps) {
  // Group entries by IST calendar day
  const groupedEntries = useMemo(() => {
    const map = new Map<string, LedgerEntry[]>();
    for (const entry of entries) {
      const label = dayLabelIST(entry.createdAt);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(entry);
    }
    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="bg-[var(--sheet)] border border-[var(--rule)] py-12 px-4 text-center">
        <p className="text-[16px] text-[var(--ink-soft)]">No entries yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* ============================================================== */}
      {/* Mobile View: Ruled rows with .khata-margin                     */}
      {/* ============================================================== */}
      <div className="block md:hidden bg-[var(--sheet)] border border-[var(--rule)] overflow-hidden">
        {groupedEntries.map(({ label, items }) => (
          <div key={label} className="border-b border-[var(--rule)] last:border-b-0">
            {/* Day Header */}
            <div className="bg-[var(--paper)] px-4 py-1.5 border-b border-[var(--rule)] text-[14px] font-bold text-[var(--ink-soft)] select-none">
              {label}
            </div>

            {/* Entries with Khata Double Margin Rule */}
            <div className="khata-margin divide-y divide-[var(--rule)]">
              {items.map((entry) => (
                <LedgerRow
                  key={entry.id}
                  entry={entry}
                  onSelect={onSelectEntry}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* Desktop View: Full 5-column Khata Table                       */}
      {/* Date, Note, Udhaar, Paid, Balance                              */}
      {/* ============================================================== */}
      <div className="hidden md:block bg-[var(--sheet)] border border-[var(--rule)] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--paper)] border-b border-[var(--rule)] text-[14px] font-bold text-[var(--ink-soft)]">
              <th className="py-2.5 px-4 w-[160px]">Date & Time</th>
              <th className="py-2.5 px-4">Note</th>
              <th className="py-2.5 px-4 text-right w-[140px]">Udhaar</th>
              <th className="py-2.5 px-4 text-right w-[140px]">Paid</th>
              <th className="py-2.5 px-4 text-right w-[160px]">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rule)] tabular-nums">
            {groupedEntries.map(({ label, items }) => (
              <React.Fragment key={label}>
                {/* Section Day Divider in Table */}
                <tr className="bg-[var(--paper)]/50 border-y border-[var(--rule)]">
                  <td
                    colSpan={5}
                    className="py-1 px-4 text-[12px] font-bold text-[var(--ink-soft)]"
                  >
                    {label}
                  </td>
                </tr>

                {items.map((entry) => {
                  const isCredit = entry.type === "CREDIT";
                  const formattedAmount = formatINR(entry.amount);
                  const formattedBalance = formatINR(entry.runningBalance);
                  const dateTimeStr = formatIST(entry.createdAt, "datetime");

                  let noteText = entry.description;
                  if (entry.isReversal) {
                    noteText = entry.description
                      ? `Reversal: ${entry.description}`
                      : "Reversal";
                  } else if (!noteText) {
                    noteText = isCredit ? "Udhaar" : "Payment";
                  }

                  const isInteractive = Boolean(onSelectEntry);

                  return (
                    <tr
                      key={entry.id}
                      onClick={
                        isInteractive
                          ? () => onSelectEntry!(entry)
                          : undefined
                      }
                      className={cn(
                        "transition-colors",
                        isInteractive &&
                          "cursor-pointer hover:bg-[var(--paper)]/60 active:bg-[var(--paper)]"
                      )}
                    >
                      <td className="py-3 px-4 text-[14px] text-[var(--ink-soft)] whitespace-nowrap">
                        {dateTimeStr}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[16px] font-bold text-[var(--ink)] block">
                          {noteText}
                        </span>
                        {entry.isReversed && (
                          <span className="text-[12px] font-bold text-[var(--ink-soft)] block">
                            Reversed
                          </span>
                        )}
                        {entry.advanceConfirmed && (
                          <span className="text-[12px] font-bold text-[var(--paid)] block">
                            Advance
                          </span>
                        )}
                      </td>

                      {/* Udhaar Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isCredit ? (
                          <span
                            className={cn(
                              "text-[16px] font-bold",
                              entry.isReversed
                                ? "line-through text-[var(--ink-soft)]"
                                : "text-[var(--owed)]"
                            )}
                          >
                            {formattedAmount}
                          </span>
                        ) : (
                          <span className="text-[var(--ink-soft)]">—</span>
                        )}
                      </td>

                      {/* Paid Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!isCredit ? (
                          <span
                            className={cn(
                              "text-[16px] font-bold",
                              entry.isReversed
                                ? "line-through text-[var(--ink-soft)]"
                                : "text-[var(--paid)]"
                            )}
                          >
                            {formattedAmount}
                          </span>
                        ) : (
                          <span className="text-[var(--ink-soft)]">—</span>
                        )}
                      </td>

                      {/* Running Balance Column */}
                      <td className="py-3 px-4 text-right text-[16px] font-bold text-[var(--ink)] whitespace-nowrap">
                        {formattedBalance}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* Pagination: Load Older Entries                                */}
      {/* ============================================================== */}
      {hasMore && onLoadOlder && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="w-full min-h-[48px] text-[16px] font-bold bg-[var(--sheet)]"
          >
            {isLoadingOlder ? "Loading older entries…" : "Load older entries"}
          </Button>
        </div>
      )}
    </div>
  );
}
