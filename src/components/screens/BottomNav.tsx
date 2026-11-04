"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Users, Menu, Settings, LogOut } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { logoutAction } from "@/app/(auth)/login/actions";
import { cn } from "@/components/ui/utils";

function BottomNavContent() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [isLoggingOut, startLogoutTransition] = React.useTransition();

  const isHomeActive = pathname === "/";
  const isCustomersActive = pathname.startsWith("/customers");
  const isUdhaarActive =
    pathname === "/entry" && searchParams.get("type") !== "payment";
  const isPaymentActive =
    pathname === "/entry" && searchParams.get("type") === "payment";
  const isMoreActive = pathname.startsWith("/settings");

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--sheet)] border-t border-[var(--rule)] grid grid-cols-5 z-40 md:hidden"
        aria-label="Mobile navigation"
      >
        {/* 1. Home */}
        <Link
          href="/"
          className="relative flex flex-col items-center justify-center min-h-[48px] h-full text-[var(--ink)]"
          aria-current={isHomeActive ? "page" : undefined}
        >
          {isHomeActive && (
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ink)]" />
          )}
          <Home size={20} strokeWidth={1.75} className="text-[var(--ink)]" />
          <span
            className={cn(
              "text-[12px] leading-tight mt-1 text-[var(--ink)]",
              isHomeActive && "font-bold"
            )}
          >
            Home
          </span>
        </Link>

        {/* 2. Customers */}
        <Link
          href="/customers"
          className="relative flex flex-col items-center justify-center min-h-[48px] h-full text-[var(--ink)]"
          aria-current={isCustomersActive ? "page" : undefined}
        >
          {isCustomersActive && (
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ink)]" />
          )}
          <Users size={20} strokeWidth={1.75} className="text-[var(--ink)]" />
          <span
            className={cn(
              "text-[12px] leading-tight mt-1 text-[var(--ink)]",
              isCustomersActive && "font-bold"
            )}
          >
            Customers
          </span>
        </Link>

        {/* 3. Udhaar (filled --owed with white text) */}
        <div className="relative flex items-center justify-center h-full px-1">
          {isUdhaarActive && (
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ink)]" />
          )}
          <Link
            href="/entry?type=udhaar"
            className={cn(
              "w-full h-12 min-h-[48px] bg-[var(--owed)] text-white rounded-[var(--radius-control)] flex items-center justify-center text-[13px] font-bold active:scale-[0.98] transition-transform",
              isUdhaarActive && "ring-2 ring-[var(--ink)] ring-offset-1"
            )}
            aria-current={isUdhaarActive ? "page" : undefined}
          >
            Udhaar
          </Link>
        </div>

        {/* 4. Payment (filled --paid with white text) */}
        <div className="relative flex items-center justify-center h-full px-1">
          {isPaymentActive && (
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ink)]" />
          )}
          <Link
            href="/entry?type=payment"
            className={cn(
              "w-full h-12 min-h-[48px] bg-[var(--paid)] text-white rounded-[var(--radius-control)] flex items-center justify-center text-[13px] font-bold active:scale-[0.98] transition-transform",
              isPaymentActive && "ring-2 ring-[var(--ink)] ring-offset-1"
            )}
            aria-current={isPaymentActive ? "page" : undefined}
          >
            Payment
          </Link>
        </div>

        {/* 5. More (opens small sheet) */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="relative flex flex-col items-center justify-center min-h-[48px] h-full text-[var(--ink)]"
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          aria-label="Open more menu"
        >
          {isMoreActive && (
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ink)]" />
          )}
          <Menu size={20} strokeWidth={1.75} className="text-[var(--ink)]" />
          <span
            className={cn(
              "text-[12px] leading-tight mt-1 text-[var(--ink)]",
              isMoreActive && "font-bold"
            )}
          >
            More
          </span>
        </button>
      </nav>

      {/* More Bottom Sheet */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="bg-[var(--sheet)]">
          <DrawerHeader className="border-b border-[var(--rule)] pb-3">
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>

          <div className="py-2">
            <div className="ruled-row">
              <Link
                href="/settings"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-6 py-4 min-h-[48px] text-[16px] text-[var(--ink)] hover:bg-[var(--paper)] transition-colors"
              >
                <Settings
                  size={20}
                  strokeWidth={1.75}
                  className="text-[var(--ink)]"
                />
                <span>Settings</span>
              </Link>
            </div>

            <div className="ruled-row">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-6 py-4 min-h-[48px] text-[16px] text-[var(--ink)] hover:text-[var(--owed)] hover:bg-[var(--paper)] transition-colors disabled:opacity-50 text-left"
              >
                <LogOut
                  size={20}
                  strokeWidth={1.75}
                  className="text-inherit"
                />
                <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function BottomNav() {
  return (
    <React.Suspense
      fallback={
        <nav
          className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--sheet)] border-t border-[var(--rule)] grid grid-cols-5 z-40 md:hidden"
          aria-label="Mobile navigation loading"
        />
      }
    >
      <BottomNavContent />
    </React.Suspense>
  );
}
