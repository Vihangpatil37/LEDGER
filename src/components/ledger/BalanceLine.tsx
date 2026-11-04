import React from "react";
import type { CustomerStatus } from "@/lib/contracts/customers";
import { formatINR, moneyToPaise, paiseToString } from "@/lib/money";
import { cn } from "@/components/ui/utils";

export interface BalanceLineProps {
  status: CustomerStatus;
  balance: string;
  alertStep: string;
  alertLevel: number;
  isActive?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * BalanceLine component adhering to Section 7.6.3 & 7.7:
 * Renders status variants with required word cues (never color alone):
 * - OWING: "Owes ₹X" in --owed
 * - ALERT: "Owes ₹X" in --owed + "Crossed ₹X" on --alert-wash
 * - CLEAR: "Settled" in --ink-soft
 * - ADVANCE: "Advance ₹X" in --paid
 * - Inactive note: "Inactive. New udhaar is blocked."
 */
export function BalanceLine({
  status,
  balance,
  alertStep,
  alertLevel,
  isActive = true,
  className,
  compact = false,
}: BalanceLineProps) {
  // Format positive/absolute balance
  const paise = moneyToPaise(balance);
  const absPaise = Math.abs(paise);
  const formattedAbs = formatINR(paiseToString(absPaise));

  // Crossed amount calculation: alertLevel * alertStep
  const stepPaise = moneyToPaise(alertStep);
  const crossedPaise = alertLevel > 0 ? alertLevel * stepPaise : stepPaise;
  const crossedFormatted = formatINR(paiseToString(crossedPaise));

  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
        {status === "OWING" && (
          <span className="font-bold text-[var(--owed)]">
            Owes {formattedAbs}
          </span>
        )}

        {status === "ALERT" && (
          <>
            <span className="font-bold text-[var(--owed)]">
              Owes {formattedAbs}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-chip)] bg-[var(--alert-wash)] text-[var(--alert-ink)] text-[12px] font-bold border border-[var(--alert-ink)]/20">
              Crossed {crossedFormatted}
            </span>
          </>
        )}

        {status === "CLEAR" && (
          <span className="font-medium text-[var(--ink-soft)]">
            Settled
          </span>
        )}

        {status === "ADVANCE" && (
          <span className="font-bold text-[var(--paid)]">
            Advance {formattedAbs}
          </span>
        )}
      </div>

      {!isActive && (
        <span
          className={cn(
            "text-[var(--ink-soft)] font-medium",
            compact ? "text-[12px]" : "text-[14px]"
          )}
        >
          Inactive. New udhaar is blocked.
        </span>
      )}
    </div>
  );
}
