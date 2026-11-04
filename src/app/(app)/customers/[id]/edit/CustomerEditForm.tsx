"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { CustomerBalance } from "@/lib/contracts/customers";
import {
  updateCustomerAction,
  setCustomerActiveAction,
} from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";
import {
  ConfirmSheet,
  type DuplicateCustomerItem,
} from "@/components/screens/ConfirmSheet";

export interface CustomerEditFormProps {
  customer: CustomerBalance;
}

export function CustomerEditForm({ customer }: CustomerEditFormProps) {
  const router = useRouter();
  const phoneInputRef = React.useRef<HTMLInputElement>(null);

  // Strip leading 91 for cleaner editing of 10 digits
  const raw10Phone = customer.phone.startsWith("91") && customer.phone.length === 12
    ? customer.phone.slice(2)
    : customer.phone;

  const [name, setName] = React.useState(customer.name);
  const [phone, setPhone] = React.useState(raw10Phone);
  const [alertStep, setAlertStep] = React.useState(
    parseFloat(customer.alertStep) ? parseFloat(customer.alertStep).toString() : "500"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isStatusPending, startStatusTransition] = React.useTransition();

  // Duplicate phone warning state
  const [duplicateSheetOpen, setDuplicateSheetOpen] = React.useState(false);
  const [duplicateWarning, setDuplicateWarning] = React.useState<{
    title: string;
    existing: DuplicateCustomerItem[];
  } | null>(null);

  const handleSubmit = (e?: React.FormEvent, confirmDuplicate = false) => {
    e?.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Enter a customer name.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Enter a 10-digit mobile number starting with 6, 7, 8 or 9.");
      return;
    }

    const stepNum = parseFloat(alertStep);
    if (isNaN(stepNum) || stepNum <= 0 || stepNum > 1000000) {
      setErrorMessage("Amount must be between ₹0.01 and ₹1,00,000.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateCustomerAction({
          id: customer.id,
          name: name.trim(),
          phone: phone.trim(),
          alertStep: stepNum.toFixed(2),
          confirmDuplicate,
        });

        if (!result.ok) {
          if (result.error.code === "DUPLICATE_PHONE") {
            const existing = (result.error.details as any)?.existing || [];
            setDuplicateWarning({
              title: result.error.message || "This number is already saved.",
              existing,
            });
            setDuplicateSheetOpen(true);
            return;
          }

          setErrorMessage(result.error.message || "Could not save. Nothing was changed. Try again.");
          return;
        }

        router.push(`/customers/${customer.id}`);
        router.refresh();
      } catch {
        setErrorMessage("Not saved. Check your connection and try again.");
      }
    });
  };

  const handleToggleActive = () => {
    setErrorMessage(null);
    startStatusTransition(async () => {
      try {
        const newStatus = !customer.isActive;
        const result = await setCustomerActiveAction({
          id: customer.id,
          isActive: newStatus,
        });

        if (!result.ok) {
          setErrorMessage(result.error.message || "Could not update status.");
          return;
        }

        router.push(`/customers/${customer.id}`);
        router.refresh();
      } catch {
        setErrorMessage("Not saved. Check your connection and try again.");
      }
    });
  };

  const handleConfirmDuplicate = () => {
    setDuplicateSheetOpen(false);
    handleSubmit(undefined, true);
  };

  const handleCancelDuplicate = () => {
    setDuplicateSheetOpen(false);
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          <span>Back to customer</span>
        </Link>
      </div>

      <h1 className="text-[22px] font-bold text-[var(--ink)]">
        Edit customer
      </h1>

      <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-5" noValidate>
        {/* Name Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            disabled={isPending || isStatusPending}
            required
            error={!!errorMessage && !name.trim()}
          />
        </div>

        {/* Mobile Number Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-phone">Mobile number</Label>
          <Input
            ref={phoneInputRef}
            id="edit-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            disabled={isPending || isStatusPending}
            required
            error={!!errorMessage && phone.replace(/\D/g, "").length < 10}
          />
        </div>

        {/* Alert Step Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-alert-step">Alert step (₹)</Label>
          <Input
            id="edit-alert-step"
            type="text"
            inputMode="decimal"
            value={alertStep}
            onChange={(e) => setAlertStep(e.target.value)}
            placeholder="500"
            disabled={isPending || isStatusPending}
            required
          />
          <p className="text-[12px] text-[var(--ink-soft)]">
            An alert triggers each time the balance crosses a multiple of this amount.
          </p>
        </div>

        {errorMessage && (
          <InlineError message={errorMessage} />
        )}

        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={isPending || isStatusPending || !name.trim() || !phone.trim()}
          className="w-full mt-2 font-bold"
        >
          {isPending ? "Saving…" : "Save customer"}
        </Button>
      </form>

      {/* Deactivate / Reactivate Customer at the bottom per Section 7.5 */}
      <div className="pt-6 border-t border-[var(--rule)] flex flex-col gap-2">
        <h2 className="text-[16px] font-bold text-[var(--ink)]">
          Customer status
        </h2>
        <p className="text-[14px] text-[var(--ink-soft)]">
          {customer.isActive
            ? "Deactivating blocks new udhaar credit. Existing balance and payments are preserved."
            : "Reactivating allows new udhaar credit to be recorded again."}
        </p>

        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={isPending || isStatusPending}
          onClick={handleToggleActive}
          className={`w-full font-bold mt-2 ${
            customer.isActive
              ? "text-[var(--owed)] border-[var(--owed)]/40 hover:bg-[var(--owed)]/10"
              : "text-[var(--paid)] border-[var(--paid)]/40 hover:bg-[var(--paid)]/10"
          }`}
        >
          {isStatusPending
            ? "Saving…"
            : customer.isActive
            ? "Deactivate customer"
            : "Reactivate customer"}
        </Button>
      </div>

      {/* Duplicate Phone Confirmation Sheet */}
      {duplicateWarning && (
        <ConfirmSheet
          open={duplicateSheetOpen}
          onOpenChange={setDuplicateSheetOpen}
          title={duplicateWarning.title}
          existingCustomers={duplicateWarning.existing}
          confirmLabel="Save anyway"
          cancelLabel="Change number"
          onConfirm={handleConfirmDuplicate}
          onCancel={handleCancelDuplicate}
          isPending={isPending}
        />
      )}
    </div>
  );
}
