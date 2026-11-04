"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Chai Ledger Toast Container.
 * 
 * IMPORTANT SPEC CONSTRAINT (Section 7.2, 7.3 rule 10):
 * Sonner must NEVER be used for money transactions or ledger results!
 * All financial results use ResultSheet (Section 7.6.4).
 * This toaster is reserved exclusively for non-financial system messages
 * (e.g. settings saved, link copied).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--sheet)] group-[.toaster]:text-[var(--ink)] group-[.toaster]:border-[var(--rule)] group-[.toaster]:rounded-[var(--radius-control)] group-[.toaster]:shadow-[0_4px_16px_rgba(23,33,43,0.08)] group-[.toaster]:font-sans text-[16px]",
          description: "group-[.toast]:text-[var(--ink-soft)] text-[14px]",
          actionButton:
            "group-[.toast]:bg-[var(--ink)] group-[.toast]:text-white group-[.toast]:rounded-[var(--radius-control)] min-h-[44px] px-3 font-bold",
          cancelButton:
            "group-[.toast]:bg-[var(--paper)] group-[.toast]:text-[var(--ink)] group-[.toast]:rounded-[var(--radius-control)] min-h-[44px] px-3",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
