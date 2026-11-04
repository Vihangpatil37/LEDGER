"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ChevronRight } from "lucide-react";
import type { CustomerBalance } from "@/lib/contracts/customers";
import type { CreateTransactionResult } from "@/lib/contracts/transactions";
import { parseAmountToPaise, moneyToPaise, paiseToString, formatINR } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import { createTransactionAction } from "@/app/(app)/entry/actions";
import { AmountField } from "@/components/ledger/AmountField";
import { NoteChips } from "@/components/ledger/NoteChips";
import { CustomerPicker } from "@/components/ledger/CustomerPicker";
import { ConfirmSheet } from "@/components/screens/ConfirmSheet";
import { ResultSheet } from "@/components/screens/ResultSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/ui/inline-error";
import { cn } from "@/components/ui/utils";

export interface EntryViewProps {
  customers: CustomerBalance[];
  initialType?: "udhaar" | "payment";
  initialCustomerId?: string;
  reminderTemplate?: string;
  shopName?: string | null;
}

export function EntryView({
  customers,
  initialType = "udhaar",
  initialCustomerId = "",
  reminderTemplate = "",
  shopName = null,
}: EntryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: "udhaar" or "payment"
  const typeParam = searchParams.get("type");
  const mode: "udhaar" | "payment" =
    typeParam === "payment" ? "payment" : initialType === "payment" ? "payment" : "udhaar";

  // Pre-selected customer from props or URL
  const customerIdParam = searchParams.get("customer") || initialCustomerId;
  const initialCustomer = React.useMemo(() => {
    if (!customerIdParam) return null;
    return customers.find((c) => c.id === customerIdParam) || null;
  }, [customerIdParam, customers]);

  // Amount prefill from URL (e.g. ?amount=500 or ?full=1)
  const amountParam = searchParams.get("amount");
  const fullParam = searchParams.get("full");

  // Form states
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerBalance | null>(initialCustomer);
  const [amount, setAmount] = React.useState(() => {
    if (amountParam) return amountParam;
    if (fullParam === "1" && initialCustomer && Number(initialCustomer.balance) > 0) {
      const num = parseFloat(initialCustomer.balance);
      return num % 1 === 0 ? String(num) : num.toFixed(2);
    }
    return "";
  });
  const [note, setNote] = React.useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);

  // Idempotency key (generated on mount and after successful save dismissal)
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>(() => crypto.randomUUID());

  // Error & submission states
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Advance confirmation sheet state
  const [advanceConfirmOpen, setAdvanceConfirmOpen] = React.useState(false);
  const [advanceFigures, setAdvanceFigures] = React.useState<
    { label: string; value: string; isHighlighted?: boolean }[]
  >([]);

  // Result sheet state
  const [resultSheetOpen, setResultSheetOpen] = React.useState(false);
  const [saveResult, setSaveResult] = React.useState<CreateTransactionResult | null>(null);

  // Focus amount input if customer preselected
  const amountRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (initialCustomer) {
      setTimeout(() => {
        amountRef.current?.focus();
      }, 100);
    }
  }, [initialCustomer]);

  // Mode switcher handler
  const handleModeChange = (newMode: "udhaar" | "payment") => {
    if (newMode === mode) return;
    setErrorMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", newMode);
    router.replace(`/entry?${params.toString()}`);
  };

  // One-line balance readout under customer
  const customerBalanceReadout = React.useMemo(() => {
    if (!selectedCustomer) return null;
    const paise = moneyToPaise(selectedCustomer.balance);
    const abs = formatINR(paiseToString(Math.abs(paise)));

    if (paise > 0) {
      return <span className="text-[14px] font-bold text-[var(--owed)]">Owes {abs}</span>;
    } else if (paise < 0) {
      return <span className="text-[14px] font-bold text-[var(--paid)]">Advance {abs}</span>;
    }
    return <span className="text-[14px] text-[var(--ink-soft)] font-medium">Settled</span>;
  }, [selectedCustomer]);

  // Execution of the transaction save
  const executeSave = (confirmAdvance = false) => {
    if (!selectedCustomer) {
      setErrorMessage("Please select a customer.");
      return;
    }

    const paise = parseAmountToPaise(amount);
    if (paise === null || paise <= 0) {
      setErrorMessage("Enter an amount like 50 or 50.50.");
      return;
    }

    // Check advance payment condition client-side first (Section 7.6.2)
    if (mode === "payment" && !confirmAdvance) {
      const currentBalPaise = moneyToPaise(selectedCustomer.balance);
      if (paise > currentBalPaise) {
        const advanceAfterPaise = paise - currentBalPaise;
        setAdvanceFigures([
          { label: "Current balance", value: formatINR(selectedCustomer.balance) },
          { label: "Payment amount", value: formatINR(paiseToString(paise)) },
          {
            label: "Advance after",
            value: formatINR(paiseToString(advanceAfterPaise)),
            isHighlighted: true,
          },
        ]);
        setAdvanceConfirmOpen(true);
        return;
      }
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await createTransactionAction({
          customerId: selectedCustomer.id,
          type: mode === "udhaar" ? "CREDIT" : "PAYMENT",
          amount: (paise / 100).toFixed(2),
          description: note.trim() || null,
          idempotencyKey,
          confirmAdvance,
        });

        if (!result.ok) {
          // If server required advance confirmation
          if (result.error.code === "ADVANCE_CONFIRMATION_REQUIRED") {
            const details = (result.error.details as any) || {};
            setAdvanceFigures([
              { label: "Current balance", value: formatINR(details.balance || selectedCustomer.balance) },
              { label: "Payment amount", value: formatINR(details.amount || amount) },
              {
                label: "Advance after",
                value: formatINR(details.advanceAfter || "0.00"),
                isHighlighted: true,
              },
            ]);
            setAdvanceConfirmOpen(true);
            return;
          }

          setErrorMessage(result.error.message || "Could not save. Nothing was changed. Try again.");
          return;
        }

        // On success: open ResultSheet
        setSaveResult(result.data);
        setResultSheetOpen(true);
      } catch {
        setErrorMessage("Not saved. Check your connection and try again.");
      }
    });
  };

  const handleAdvanceConfirm = () => {
    setAdvanceConfirmOpen(false);
    executeSave(true);
  };

  const handleAdvanceCancel = () => {
    setAdvanceConfirmOpen(false);
  };

  // Reset form ONLY after ResultSheet is closed (Section 7.6.2 & 7.6.4)
  const handleResultDone = () => {
    setResultSheetOpen(false);
    setSaveResult(null);
    setSelectedCustomer(null);
    setAmount("");
    setNote("");
    setErrorMessage(null);
    setIdempotencyKey(crypto.randomUUID());
  };

  const isSaveDisabled =
    isPending ||
    !selectedCustomer ||
    !amount.trim() ||
    parseAmountToPaise(amount) === null ||
    (parseAmountToPaise(amount) ?? 0) <= 0;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pb-28">
      {/* 1. Segmented Switch: Udhaar | Payment */}
      <div
        role="tablist"
        aria-label="Transaction type"
        className="grid grid-cols-2 p-1 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "udhaar"}
          onClick={() => handleModeChange("udhaar")}
          className={cn(
            "min-h-[44px] h-11 text-[16px] font-bold rounded-[calc(var(--radius-control)-4px)] transition-all",
            mode === "udhaar"
              ? "bg-[var(--ink)] text-white shadow-none"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          )}
        >
          Udhaar
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "payment"}
          onClick={() => handleModeChange("payment")}
          className={cn(
            "min-h-[44px] h-11 text-[16px] font-bold rounded-[calc(var(--radius-control)-4px)] transition-all",
            mode === "payment"
              ? "bg-[var(--ink)] text-white shadow-none"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          )}
        >
          Payment
        </button>
      </div>

      {/* 2. Customer Picker Button (56px full width) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-bold text-[var(--ink-soft)]">
          Customer
        </label>
        <button
          type="button"
          onClick={() => setCustomerPickerOpen(true)}
          disabled={isPending}
          className="w-full min-h-[56px] h-14 px-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)] flex items-center justify-between text-left transition-colors hover:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <User className="h-5 w-5 text-[var(--ink-soft)] shrink-0" strokeWidth={1.75} />
            {selectedCustomer ? (
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] font-bold text-[var(--ink)] truncate">
                  {selectedCustomer.name}
                </span>
                <span className="text-[12px] text-[var(--ink-soft)] tabular-nums">
                  {formatPhoneDisplay(selectedCustomer.phone)}
                </span>
              </div>
            ) : (
              <span className="text-[16px] text-[var(--ink-soft)]">
                Select customer
              </span>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--ink-soft)] shrink-0" strokeWidth={1.75} />
        </button>

        {/* 3. One-line balance readout */}
        {customerBalanceReadout && (
          <div className="pl-1 pt-0.5">{customerBalanceReadout}</div>
        )}
      </div>

      {/* 4. Amount Field with quick-add, subtract, and settle full chips */}
      <AmountField
        value={amount}
        onChange={setAmount}
        disabled={isPending}
        fullBalance={
          selectedCustomer && Number(selectedCustomer.balance) > 0
            ? selectedCustomer.balance
            : null
        }
      />

      {/* 5. Note Field with NoteChips */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-note">Note (optional)</Label>
        <Input
          id="entry-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Chai, Cigarette, Cold drink"
          maxLength={140}
          disabled={isPending}
          className="min-h-[48px] bg-[var(--sheet)]"
        />
        <NoteChips value={note} onChange={setNote} disabled={isPending} />
      </div>

      {/* Sticky Footer Save Button (56px) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-[var(--paper)]/95 backdrop-blur-none border-t border-[var(--rule)] z-30">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          {errorMessage && (
            <InlineError message={errorMessage} className="mb-1" />
          )}

          <Button
            type="button"
            variant={mode === "udhaar" ? "owed" : "paid"}
            size="save"
            disabled={isSaveDisabled}
            onClick={() => executeSave(false)}
            className="w-full text-[18px] font-bold"
          >
            {isPending
              ? "Saving…"
              : mode === "udhaar"
              ? "Save udhaar"
              : "Save payment"}
          </Button>
        </div>
      </div>

      {/* Customer Picker Bottom Sheet */}
      <CustomerPicker
        open={customerPickerOpen}
        onOpenChange={setCustomerPickerOpen}
        customers={customers}
        mode={mode}
        value={selectedCustomer?.id}
        onChange={(cust) => {
          setSelectedCustomer(cust);
          setErrorMessage(null);
        }}
      />

      {/* Advance Payment Confirmation Sheet */}
      <ConfirmSheet
        open={advanceConfirmOpen}
        onOpenChange={setAdvanceConfirmOpen}
        title="Payment is more than the balance."
        figures={advanceFigures}
        confirmLabel="Save as advance"
        cancelLabel="Change amount"
        onConfirm={handleAdvanceConfirm}
        onCancel={handleAdvanceCancel}
        isPending={isPending}
      />

      {/* Result Sheet on Success */}
      <ResultSheet
        open={resultSheetOpen}
        onOpenChange={setResultSheetOpen}
        result={saveResult}
        onDone={handleResultDone}
        reminderMessage={
          saveResult && reminderTemplate
            ? reminderTemplate
                .replace("{name}", saveResult.customer.name)
                .replace("{amount}", saveResult.balanceAfter)
                .replace("{shop}", shopName || "")
            : ""
        }
      />
    </div>
  );
}
