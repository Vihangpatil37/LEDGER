import React from "react";
import { formatINR } from "@/lib/money";
import { cn } from "@/components/ui/utils";

export interface MoneyTextProps {
  value: string;
  tone?: "owed" | "paid" | "plain";
  size?: "meta" | "body" | "figure";
  className?: string;
  as?: React.ElementType;
}

/**
 * MoneyText component adhering strictly to Section 7.2 & 7.7:
 * Enforces en-IN currency formatting via formatINR, tabular-nums for numeric alignment,
 * and semantic tone colors (--owed, --paid, --ink).
 */
export function MoneyText({
  value,
  tone = "plain",
  size = "body",
  className,
  as: Component = "span",
}: MoneyTextProps) {
  const formatted = formatINR(value);

  const toneClass =
    tone === "owed"
      ? "text-[var(--owed)]"
      : tone === "paid"
      ? "text-[var(--paid)]"
      : "text-[var(--ink)]";

  const sizeClass =
    size === "meta"
      ? "text-[14px]"
      : size === "figure"
      ? "text-[32px] font-bold"
      : "text-[16px]";

  return (
    <Component
      className={cn("tabular-nums", toneClass, sizeClass, className)}
      data-money
    >
      {formatted}
    </Component>
  );
}
