"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export interface DuplicateCustomerItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ConfirmFigureItem {
  label: string;
  value: string;
  isHighlighted?: boolean;
}

export interface ConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  existingCustomers?: DuplicateCustomerItem[];
  figures?: ConfirmFigureItem[];
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isPending?: boolean;
}

/**
 * ConfirmSheet component adhering strictly to Section 7.6.4:
 * - Used for duplicate phone warnings and advance payment confirmations.
 * - Ruled list of existing items or figures.
 * - Primary confirm button and secondary cancel/change button.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  existingCustomers,
  figures,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmSheetProps) {
  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[var(--sheet)] max-w-lg mx-auto">
        <DrawerHeader className="border-b border-[var(--rule)] pb-4 text-left">
          <DrawerTitle className="text-[18px] sm:text-[22px] font-bold text-[var(--ink)]">
            {title}
          </DrawerTitle>
          {description && (
            <DrawerDescription className="text-[14px] text-[var(--ink-soft)] mt-1">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>

        {/* Figures List for Advance Payment Confirmation */}
        {figures && figures.length > 0 && (
          <div className="p-4">
            <dl className="border border-[var(--rule)] divide-y divide-[var(--rule)] bg-[var(--sheet)]">
              {figures.map((fig) => (
                <div
                  key={fig.label}
                  className="px-4 py-3 flex items-center justify-between text-[16px]"
                >
                  <dt className="text-[14px] text-[var(--ink-soft)]">{fig.label}</dt>
                  <dd
                    className={`text-[16px] font-bold tabular-nums ${
                      fig.isHighlighted ? "text-[var(--paid)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {fig.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Existing Customers List for Duplicate Phone Warning */}
        {existingCustomers && existingCustomers.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2 text-[14px] font-bold text-[var(--ink-soft)]">
              Already registered
            </div>
            <div className="border-y border-[var(--rule)] divide-y divide-[var(--rule)] bg-[var(--sheet)]">
              {existingCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="px-4 py-3 flex items-center justify-between text-[16px]"
                >
                  <span className="font-bold text-[var(--ink)]">{cust.name}</span>
                  <span className="text-[14px] text-[var(--ink-soft)]">
                    {cust.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DrawerFooter className="flex flex-col gap-2.5 pt-4 pb-6">
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full font-bold"
          >
            {isPending ? "Saving…" : confirmLabel}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleCancel}
            disabled={isPending}
            className="w-full font-bold border-[var(--rule)]"
          >
            {cancelLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
