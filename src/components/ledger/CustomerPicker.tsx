"use client";

import React, { useState, useMemo } from "react";
import type { CustomerBalance } from "@/lib/contracts/customers";
import { formatPhoneDisplay } from "@/lib/phone";
import { moneyToPaise } from "@/lib/money";
import { Search, X, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { BalanceLine } from "@/components/ledger/BalanceLine";
import { cn } from "@/components/ui/utils";

export interface CustomerPickerProps {
  customers: CustomerBalance[];
  mode: "udhaar" | "payment";
  value?: string;
  onChange: (customer: CustomerBalance) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

/**
 * CustomerPicker component adhering strictly to Section 7.6.2 & 7.7:
 * - Built inside Vaul Drawer bottom sheet.
 * - Client-side search by customer name or phone digits.
 * - Filtering:
 *   - mode === 'udhaar': Inactive customers are hidden (D-07).
 *   - mode === 'payment': Inactive customers shown ONLY if balance !== 0.
 * - Ruled rows with minimum 48px touch targets.
 * - Displays customer name, formatted phone (+91 XXXXX XXXXX), and BalanceLine.
 */
export function CustomerPicker({
  customers,
  mode,
  value,
  onChange,
  open,
  onOpenChange,
  className,
}: CustomerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter customers by mode and search query
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const digitsOnly = searchQuery.replace(/\D/g, "");

    return customers.filter((c) => {
      // Mode rule 1: For Udhaar, inactive customers are hidden
      if (mode === "udhaar" && !c.isActive) {
        return false;
      }

      // Mode rule 2: For Payment, inactive customers are shown ONLY if balance is not 0
      if (mode === "payment" && !c.isActive) {
        const paise = moneyToPaise(c.balance);
        if (paise === 0 || c.status === "CLEAR") {
          return false;
        }
      }

      // If query is empty, include all mode-eligible customers
      if (!q) {
        return true;
      }

      // Search match by name
      const nameMatch = c.name.toLowerCase().includes(q);

      // Search match by phone digits
      const phoneMatch = digitsOnly.length > 0 && c.phone.includes(digitsOnly);

      return nameMatch || phoneMatch;
    });
  }, [customers, mode, searchQuery]);

  const handleSelect = (customer: CustomerBalance) => {
    onChange(customer);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn("max-h-[85vh]", className)}>
        <DrawerHeader className="px-4 pt-2 pb-3 border-b border-[var(--rule)]">
          <DrawerTitle className="text-[18px] font-bold text-[var(--ink)] mb-3 text-left">
            {mode === "udhaar" ? "Select customer for udhaar" : "Select customer for payment"}
          </DrawerTitle>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search
              className="absolute left-3.5 h-5 w-5 text-[var(--ink-soft)] pointer-events-none"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or mobile number"
              aria-label="Search customer by name or phone"
              autoFocus
              className="w-full min-h-[48px] rounded-[var(--radius-control)] border border-[var(--rule)] bg-[var(--sheet)] pl-11 pr-10 py-2.5 text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </DrawerHeader>

        {/* Customer List */}
        <div className="overflow-y-auto max-h-[60vh] divide-y divide-[var(--rule)]">
          {filteredCustomers.length === 0 ? (
            <div className="py-12 px-4 text-center">
              {searchQuery ? (
                <p className="text-[14px] text-[var(--ink-soft)]">
                  No customer matches &ldquo;{searchQuery}&rdquo;.
                </p>
              ) : (
                <p className="text-[14px] text-[var(--ink-soft)]">
                  No customers eligible for {mode}.
                </p>
              )}
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = customer.id === value;
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className={cn(
                    "w-full min-h-[48px] text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-[var(--paper)] active:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]",
                    isSelected && "bg-[var(--paper)]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-bold text-[var(--ink)] truncate">
                        {customer.name}
                      </span>
                      {isSelected && (
                        <Check
                          className="h-4 w-4 text-[var(--ink)] shrink-0"
                          strokeWidth={2}
                          aria-label="Selected"
                        />
                      )}
                    </div>
                    <span className="text-[14px] text-[var(--ink-soft)] tabular-nums block mt-0.5">
                      {formatPhoneDisplay(customer.phone)}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <BalanceLine
                      status={customer.status}
                      balance={customer.balance}
                      alertStep={customer.alertStep}
                      alertLevel={customer.alertLevel}
                      isActive={customer.isActive}
                      compact={true}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
