"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component adhering strictly to Section 7.5 & 7.8:
 * Copy: "This page could not load. Check your connection and reload."
 * Button: "Reload"
 */
export default function AppError({ reset }: ErrorProps) {
  React.useEffect(() => {
    // Intentionally quiet per Section 7.3 (no console.log noise in prod)
  }, []);

  return (
    <div
      role="alert"
      className="w-full max-w-lg py-12 flex flex-col items-start gap-4"
    >
      <h1 className="text-[22px] font-bold text-[var(--ink)]">
        Error
      </h1>

      {/* Copy verbatim from Section 7.8 */}
      <p className="text-[16px] text-[var(--ink-soft)] leading-relaxed">
        This page could not load. Check your connection and reload.
      </p>

      <Button
        type="button"
        variant="primary"
        size="default"
        onClick={() => reset()}
        className="mt-2 font-bold min-w-[120px]"
      >
        Reload
      </Button>
    </div>
  );
}
