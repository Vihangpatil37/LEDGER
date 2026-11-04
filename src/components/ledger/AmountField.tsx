"use client";

import React from "react";
import { formatINR, moneyToPaise, paiseToString } from "@/lib/money";
import { InlineError } from "@/components/ui/inline-error";
import { cn } from "@/components/ui/utils";

export interface AmountFieldProps {
  value: string;
  onChange: (val: string) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  id?: string;
  fullBalance?: string | null;
}

/**
 * Sanitizes input allowing only numbers, at most one dot, max 2 decimals,
 * and maximum value of 1,00,000.
 */
function sanitizeAmountInput(raw: string): string {
  let val = raw.replace(/[^\d.]/g, "");

  // Allow at most one dot
  const parts = val.split(".");
  if (parts.length > 2) {
    val = parts[0] + "." + parts.slice(1).join("");
  }

  // At most 2 decimal places
  const [whole, dec] = val.split(".");
  if (dec !== undefined) {
    val = `${whole}.${dec.slice(0, 2)}`;
  }

  // Prevent multiple leading zeroes
  if (val.startsWith("0") && val.length > 1 && !val.startsWith("0.")) {
    val = val.replace(/^0+/, "") || "0";
  }

  // Cap at 100,000
  const num = parseFloat(val);
  if (!isNaN(num) && num > 100000) {
    return "100000";
  }

  return val;
}

/**
 * AmountField component adhering strictly to Section 7.6.2 & 7.7:
 * - 32px bold text, inputmode="decimal", prefixed with ₹.
 * - Tabular numbers.
 * - Quick-add chips (+10, +20, +50, +100) and Clear button.
 * - Chips are 44px tall, radius --radius-chip: 6px.
 */
export function AmountField({
  value,
  onChange,
  error,
  disabled = false,
  className,
  id = "amount-input",
  fullBalance,
}: AmountFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeAmountInput(e.target.value);
    onChange(sanitized);
  };

  const handleQuickAdd = (increment: number) => {
    if (disabled) return;
    const currentPaise = value ? moneyToPaise(value) : 0;
    const newPaise = Math.min(currentPaise + increment * 100, 100000 * 100);
    if (newPaise <= 0) {
      onChange("");
    } else if (newPaise % 100 === 0) {
      onChange(String(newPaise / 100));
    } else {
      onChange(paiseToString(newPaise));
    }
  };

  const handleQuickSubtract = (decrement: number) => {
    if (disabled) return;
    const currentPaise = value ? moneyToPaise(value) : 0;
    const newPaise = Math.max(0, currentPaise - decrement * 100);
    if (newPaise <= 0) {
      onChange("");
    } else if (newPaise % 100 === 0) {
      onChange(String(newPaise / 100));
    } else {
      onChange(paiseToString(newPaise));
    }
  };

  const handleClear = () => {
    if (disabled) return;
    onChange("");
  };

  const hasError = Boolean(error);
  const errorId = `${id}-error`;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-[14px] font-bold text-[var(--ink-soft)]"
      >
        Amount
      </label>

      {/* Hero 32px Amount Input Box */}
      <div
        className={cn(
          "flex items-center min-h-[64px] rounded-[var(--radius-control)] border border-[var(--rule)] bg-[var(--sheet)] px-4 py-2 transition-colors focus-within:ring-2 focus-within:ring-[var(--focus)] focus-within:ring-offset-2",
          hasError && "border-[var(--owed)] focus-within:ring-[var(--owed)]",
          disabled && "bg-[var(--paper)] opacity-50 cursor-not-allowed"
        )}
      >
        <span className="text-[32px] font-bold text-[var(--ink-soft)] select-none mr-2">
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0"
          aria-describedby={hasError ? errorId : undefined}
          aria-invalid={hasError}
          className="w-full text-[32px] font-bold text-[var(--ink)] tabular-nums bg-transparent border-none outline-none placeholder:text-[var(--ink-soft)]/40 disabled:cursor-not-allowed"
        />
      </div>

      {/* Quick Calculator Chips (44px tall, --radius-chip: 6px) */}
      <div className="flex flex-wrap gap-2 pt-1 items-center">
        {/* Settle Full Balance Chip (when customer owes money) */}
        {fullBalance && Number(fullBalance) > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const num = parseFloat(fullBalance);
              if (!isNaN(num) && num > 0) {
                const formatted = num % 1 === 0 ? String(num) : num.toFixed(2);
                onChange(formatted);
              }
            }}
            className="min-h-[44px] h-11 px-3.5 flex items-center justify-center rounded-[var(--radius-chip)] border border-[var(--paid)] bg-[var(--sheet)] text-[14px] font-bold text-[var(--paid)] tabular-nums transition-transform duration-100 ease-out hover:bg-[var(--paid)]/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-50 disabled:pointer-events-none"
          >
            Settle full (₹{formatINR(fullBalance)})
          </button>
        )}

        {/* Add Chips */}
        {[10, 20, 50, 100].map((inc) => (
          <button
            key={`add-${inc}`}
            type="button"
            disabled={disabled}
            onClick={() => handleQuickAdd(inc)}
            className="min-h-[44px] h-11 px-3.5 flex items-center justify-center rounded-[var(--radius-chip)] border border-[var(--rule)] bg-[var(--sheet)] text-[14px] font-bold text-[var(--ink)] tabular-nums transition-transform duration-100 ease-out hover:bg-[var(--paper)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-50 disabled:pointer-events-none"
          >
            +{inc}
          </button>
        ))}

        {/* Subtract Chips */}
        {[10, 20, 50].map((dec) => (
          <button
            key={`sub-${dec}`}
            type="button"
            disabled={disabled || !value || parseFloat(value) <= 0}
            onClick={() => handleQuickSubtract(dec)}
            className="min-h-[44px] h-11 px-3.5 flex items-center justify-center rounded-[var(--radius-chip)] border border-[var(--rule)] bg-[var(--sheet)] text-[14px] font-bold text-[var(--owed)] tabular-nums transition-transform duration-100 ease-out hover:bg-[var(--paper)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-30 disabled:pointer-events-none"
          >
            -{dec}
          </button>
        ))}

        <button
          type="button"
          disabled={disabled || !value}
          onClick={handleClear}
          className="min-h-[44px] h-11 px-3.5 flex items-center justify-center rounded-[var(--radius-chip)] border border-[var(--rule)] bg-[var(--sheet)] text-[14px] font-bold text-[var(--ink-soft)] transition-transform duration-100 ease-out hover:bg-[var(--paper)] hover:text-[var(--ink)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-30 disabled:pointer-events-none"
        >
          Clear
        </button>
      </div>

      {/* Validation Error */}
      {hasError && <InlineError id={errorId} message={error} />}
    </div>
  );
}
