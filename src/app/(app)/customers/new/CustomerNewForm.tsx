"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createCustomerAction } from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";
import {
  ConfirmSheet,
  type DuplicateCustomerItem,
} from "@/components/screens/ConfirmSheet";

export interface CustomerNewFormProps {
  defaultAlertStep: string;
}

export function CustomerNewForm({ defaultAlertStep }: CustomerNewFormProps) {
  const router = useRouter();
  const phoneInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [alertStep, setAlertStep] = React.useState(
    parseFloat(defaultAlertStep) ? parseFloat(defaultAlertStep).toString() : "500"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Duplicate phone warning state
  const [duplicateSheetOpen, setDuplicateSheetOpen] = React.useState(false);
  const [duplicateWarning, setDuplicateWarning] = React.useState<{
    title: string;
    existing: DuplicateCustomerItem[];
  } | null>(null);

  const handleSubmit = (e?: React.FormEvent, confirmDuplicate = false) => {
    e?.preventDefault();
    setErrorMessage(null);

    // Basic front validation
    if (!name.trim()) {
      setErrorMessage("Enter a customer name.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      // Copy deck verbatim: Section 7.8
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
        const result = await createCustomerAction({
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

        // On success: navigate to customer details
        router.push(`/customers/${result.data.id}`);
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
          href="/customers"
          className="inline-flex items-center gap-1.5 text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          <span>Customers</span>
        </Link>
      </div>

      <h1 className="text-[22px] font-bold text-[var(--ink)]">
        Add customer
      </h1>

      <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-5" noValidate>
        {/* Name Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-name">Name</Label>
          <Input
            id="customer-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            maxLength={80}
            disabled={isPending}
            required
            error={!!errorMessage && !name.trim()}
          />
        </div>

        {/* Mobile Number Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-phone">Mobile number</Label>
          <Input
            ref={phoneInputRef}
            id="customer-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            disabled={isPending}
            required
            error={!!errorMessage && phone.replace(/\D/g, "").length < 10}
          />
        </div>

        {/* Alert Step Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-alert-step">Alert step (₹)</Label>
          <Input
            id="customer-alert-step"
            type="text"
            inputMode="decimal"
            value={alertStep}
            onChange={(e) => setAlertStep(e.target.value)}
            placeholder="500"
            disabled={isPending}
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
          disabled={isPending || !name.trim() || !phone.trim()}
          className="w-full mt-2 font-bold"
        >
          {isPending ? "Saving…" : "Save customer"}
        </Button>
      </form>

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
