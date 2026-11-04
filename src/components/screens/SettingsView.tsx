"use client";

import * as React from "react";
import Link from "next/link";
import type { Settings } from "@/lib/contracts/settings";
import { renderReminder, validateReminderTemplate } from "@/lib/reminder";
import { updateSettingsAction } from "@/app/(app)/settings/actions";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineError } from "@/components/ui/inline-error";

export interface SettingsViewProps {
  settings: Settings;
}

export function SettingsView({ settings }: SettingsViewProps) {
  // Strip 91 prefix for clean 10-digit phone input
  const initialPhone =
    settings.phone && settings.phone.startsWith("91") && settings.phone.length === 12
      ? settings.phone.slice(2)
      : settings.phone || "";

  const [shopName, setShopName] = React.useState(settings.shopName || "");
  const [ownerName, setOwnerName] = React.useState(settings.ownerName || "");
  const [phone, setPhone] = React.useState(initialPhone);
  const [defaultAlertStep, setDefaultAlertStep] = React.useState(
    parseFloat(settings.defaultAlertStep) ? parseFloat(settings.defaultAlertStep).toString() : "500"
  );
  const [reminderTemplate, setReminderTemplate] = React.useState(settings.reminderTemplate);

  // Status & error states
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isLoggingOut, startLogoutTransition] = React.useTransition();

  // Live preview & validation of reminder template
  const templateValidation = React.useMemo(() => {
    return validateReminderTemplate(reminderTemplate);
  }, [reminderTemplate]);

  const livePreviewText = React.useMemo(() => {
    return renderReminder(reminderTemplate, {
      name: "Rahul Patel",
      amount: "500",
      shop: shopName.trim() || null,
    });
  }, [reminderTemplate, shopName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setSuccessMessage(null);

    // Template validation
    if (!templateValidation.valid) {
      setErrorMessage(templateValidation.error || "Invalid reminder template.");
      return;
    }

    // Step validation
    const stepNum = parseFloat(defaultAlertStep);
    if (isNaN(stepNum) || stepNum <= 0 || stepNum > 1000000) {
      setErrorMessage("Amount must be between ₹0.01 and ₹1,00,000.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateSettingsAction({
          shopName: shopName.trim() || null,
          ownerName: ownerName.trim() || null,
          phone: phone.trim() || null,
          defaultAlertStep: stepNum.toFixed(2),
          reminderTemplate: reminderTemplate.trim(),
        });

        if (!result.ok) {
          setErrorMessage(result.error.message || "Could not save. Nothing was changed. Try again.");
          if (result.error.fieldErrors) {
            setFieldErrors(result.error.fieldErrors);
          }
          return;
        }

        setSuccessMessage("Settings saved.");
      } catch {
        setErrorMessage("Not saved. Check your connection and try again.");
      }
    });
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-8 pb-16">
      <div>
        <h1 className="text-[22px] font-bold text-[var(--ink)]">
          Settings
        </h1>
        <p className="text-[14px] text-[var(--ink-soft)] mt-1">
          Manage stall details, credit alert steps, and WhatsApp reminder templates.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          className="p-3.5 bg-[var(--sheet)] border-l-4 border-[var(--paid)] text-[var(--paid)] text-[14px] font-bold shadow-none"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <InlineError message={errorMessage} />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        {/* Shop Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="shop-name">Shop name</Label>
          <Input
            id="shop-name"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="e.g. Ramesh Chai Stall"
            maxLength={60}
            disabled={isPending}
            className="bg-[var(--sheet)]"
          />
          <p className="text-[12px] text-[var(--ink-soft)]">
            Used as &#123;shop&#125; in the WhatsApp reminder message.
          </p>
        </div>

        {/* Owner Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="owner-name">Owner name</Label>
          <Input
            id="owner-name"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            disabled={isPending}
            className="bg-[var(--sheet)]"
          />
        </div>

        {/* Owner Phone */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="owner-phone">Owner mobile number</Label>
          <Input
            id="owner-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            disabled={isPending}
            error={!!fieldErrors.phone}
            className="bg-[var(--sheet)]"
          />
          {fieldErrors.phone && <InlineError message={fieldErrors.phone} />}
        </div>

        {/* Default Alert Step */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="default-alert-step">Default alert step (₹)</Label>
          <Input
            id="default-alert-step"
            type="text"
            inputMode="decimal"
            value={defaultAlertStep}
            onChange={(e) => setDefaultAlertStep(e.target.value)}
            placeholder="500"
            disabled={isPending}
            required
            className="bg-[var(--sheet)]"
          />
          <p className="text-[12px] text-[var(--ink-soft)]">
            Default alert step for new customers. An alert fires when balance crosses multiples of this amount.
          </p>
        </div>

        {/* WhatsApp Reminder Template */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-template">WhatsApp reminder template</Label>
          <Textarea
            id="reminder-template"
            rows={6}
            value={reminderTemplate}
            onChange={(e) => setReminderTemplate(e.target.value)}
            disabled={isPending}
            required
            className="font-normal text-[16px] bg-[var(--sheet)] resize-none"
            aria-describedby="template-hints"
          />
          <p id="template-hints" className="text-[12px] text-[var(--ink-soft)] leading-normal">
            Must contain <strong>&#123;name&#125;</strong> and <strong>&#123;amount&#125;</strong>. Optional: <strong>&#123;shop&#125;</strong>. Between 10 and 800 characters.
          </p>
          {!templateValidation.valid && (
            <InlineError message={templateValidation.error} />
          )}

          {/* Live Reminder Preview Box adhering to Section 7.5 */}
          <div className="mt-3 p-4 bg-[var(--sheet)] border border-[var(--rule)]">
            <span className="text-[12px] font-bold text-[var(--ink-soft)] block uppercase tracking-wider mb-2">
              Live sample preview
            </span>
            <div className="p-3 bg-[var(--paper)] border border-[var(--rule)] text-[14px] text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
              {livePreviewText}
            </div>
            <p className="text-[12px] text-[var(--ink-soft)] mt-2">
              Preview shown for Rahul Patel with ₹500 balance.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={isPending || !templateValidation.valid}
          className="w-full mt-2 font-bold"
        >
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      </form>

      {/* Account Section */}
      <section className="pt-6 border-t border-[var(--rule)] flex flex-col gap-4" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-[18px] font-bold text-[var(--ink)]">
          Account
        </h2>

        <div className="bg-[var(--sheet)] border border-[var(--rule)] divide-y divide-[var(--rule)]">
          <div className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-[var(--ink)]">Password</span>
              <span className="text-[14px] text-[var(--ink-soft)]">
                Reset or update your stall login password
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="font-bold border-[var(--rule)]">
              <Link href="/forgot-password">Change password</Link>
            </Button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-[var(--ink)]">Log out</span>
              <span className="text-[14px] text-[var(--ink-soft)]">
                Sign out of Ledger on this device
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="font-bold text-[var(--owed)] border-[var(--owed)]/40 hover:bg-[var(--owed)]/10"
            >
              {isLoggingOut ? "Logging out…" : "Log out"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
