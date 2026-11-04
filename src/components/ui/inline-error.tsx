import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface InlineErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

/**
 * InlineError component adhering to Section 7.7:
 * Linked to the field via aria-describedby, announced with role="alert",
 * text styled in --owed (#A3261F), 14px text-meta.
 */
export function InlineError({ message, id, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "mt-1.5 text-[14px] font-bold text-[var(--owed)] leading-normal flex items-start gap-1",
        className
      )}
    >
      <span>{message}</span>
    </p>
  );
}
