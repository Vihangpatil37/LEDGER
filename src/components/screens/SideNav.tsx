"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";
import { cn } from "@/components/ui/utils";

interface NavLinkItem {
  name: string;
  href: string;
  isActive: (pathname: string, searchParams: URLSearchParams) => boolean;
}

const NAV_LINKS: NavLinkItem[] = [
  {
    name: "Dashboard",
    href: "/",
    isActive: (pathname) => pathname === "/",
  },
  {
    name: "Customers",
    href: "/customers",
    isActive: (pathname) => pathname.startsWith("/customers"),
  },
  {
    name: "Add udhaar",
    href: "/entry?type=udhaar",
    isActive: (pathname, searchParams) =>
      pathname === "/entry" && searchParams.get("type") !== "payment",
  },
  {
    name: "Add payment",
    href: "/entry?type=payment",
    isActive: (pathname, searchParams) =>
      pathname === "/entry" && searchParams.get("type") === "payment",
  },
  {
    name: "Settings",
    href: "/settings",
    isActive: (pathname) => pathname.startsWith("/settings"),
  },
];

function SideNavContent() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const [isLoggingOut, startLogoutTransition] = React.useTransition();

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <aside
      className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[240px] bg-[var(--paper)] border-r border-[var(--rule)] z-30"
      aria-label="Desktop navigation"
    >
      {/* Wordmark (plain text, NO logo per Section 7.4) */}
      <div className="h-16 px-6 flex items-center border-b border-[var(--rule)] shrink-0">
        <Link
          href="/"
          className="text-[18px] font-bold text-[var(--ink)] tracking-tight hover:opacity-90 transition-opacity"
        >
          Ledger
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const active = link.isActive(pathname, searchParams);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "min-h-[48px] px-6 py-3 flex items-center text-[16px] transition-colors",
                active
                  ? "font-bold text-[var(--ink)] bg-[var(--sheet)] border-l-2 border-[var(--ink)]"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--sheet)]/50"
              )}
              aria-current={active ? "page" : undefined}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Log out */}
      <div className="p-4 border-t border-[var(--rule)] shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full min-h-[48px] px-4 py-2.5 text-left text-[16px] text-[var(--ink-soft)] hover:text-[var(--owed)] transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </aside>
  );
}

export function SideNav() {
  return (
    <React.Suspense
      fallback={
        <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[240px] bg-[var(--paper)] border-r border-[var(--rule)] z-30">
          <div className="h-16 px-6 flex items-center border-b border-[var(--rule)]">
            <span className="text-[18px] font-bold text-[var(--ink)]">Ledger</span>
          </div>
        </aside>
      }
    >
      <SideNavContent />
    </React.Suspense>
  );
}
