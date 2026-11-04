import * as React from "react";
import Link from "next/link";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell: Responsive shell wrapper adhering to Section 7.4:
 * - Mobile (< 768px): fixed bottom navigation (64px high), content padded at bottom.
 * - Desktop (>= 768px): fixed left sidebar (240px wide) on --paper with --rule right border.
 * - Content max-width 960px left-aligned.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col md:flex-row">
      {/* Desktop Fixed Sidebar */}
      <SideNav />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 md:pl-[240px] flex flex-col min-h-screen">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-14 border-b border-[var(--rule)] bg-[var(--paper)] px-4 flex items-center shrink-0">
          <Link
            href="/"
            className="text-[18px] font-bold text-[var(--ink)] tracking-tight hover:opacity-90"
          >
            Ledger
          </Link>
        </header>

        {/* Left-aligned Content Container */}
        <main className="w-full max-w-[960px] min-w-0 p-4 md:p-8 pb-24 md:pb-8 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
