import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Not-found screen adhering strictly to Section 7.5 & 7.8:
 * Copy: "This customer does not exist or is not yours."
 * Link: to Customers
 */
export default function AppNotFound() {
  return (
    <div className="w-full max-w-lg py-12 flex flex-col items-start gap-4">
      <h1 className="text-[22px] font-bold text-[var(--ink)]">
        Not found
      </h1>

      {/* Copy verbatim from Section 7.8 */}
      <p className="text-[16px] text-[var(--ink-soft)] leading-relaxed">
        This customer does not exist or is not yours.
      </p>

      <Button asChild variant="primary" size="default" className="mt-2 font-bold">
        <Link href="/customers">Go to customers</Link>
      </Button>
    </div>
  );
}
