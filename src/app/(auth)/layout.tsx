import * as React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-[420px] bg-[var(--sheet)] border border-[var(--rule)] p-6 sm:p-8">
        {/* Wordmark (plain text, NO logo per Section 7.4) */}
        <div className="mb-6 pb-4 border-b border-[var(--rule)]">
          <span className="text-[18px] font-bold text-[var(--ink)] tracking-tight">
            Chai Ledger
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
