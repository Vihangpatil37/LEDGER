import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface EmptyStateProps {
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState component adhering strictly to Section 7.3 & 7.7:
 * Text only. Strictly NO illustration, NO decorative blob, NO emoji.
 */
export function EmptyState({
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center border-b border-[var(--rule)] bg-[var(--sheet)]",
        className
      )}
    >
      <h3 className="text-[18px] font-bold text-[var(--ink)] leading-snug">
        {title}
      </h3>
      {body && (
        <p className="mt-1.5 text-[14px] text-[var(--ink-soft)] max-w-sm leading-relaxed">
          {body}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
