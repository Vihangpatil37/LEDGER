import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[var(--radius-control)] border border-[var(--rule)] bg-[var(--sheet)] px-3.5 py-2.5 text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-soft)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--paper)] disabled:opacity-50",
          error && "border-[var(--owed)] focus-visible:ring-[var(--owed)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
