import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full min-h-[48px] rounded-[var(--radius-control)] border border-[var(--rule)] bg-[var(--sheet)] px-3.5 py-2.5 text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-soft)] transition-colors file:border-0 file:bg-transparent file:text-[14px] file:font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--paper)] disabled:opacity-50",
          error && "border-[var(--owed)] focus-visible:ring-[var(--owed)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
