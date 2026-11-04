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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatPhoneDisplay, isStoredPhone } from "@/lib/phone";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export interface ReminderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  phone: string;
  balance: string;
  defaultMessage: string;
  error?: string | null;
}

/**
 * ReminderSheet adhering strictly to Section 7.6.4:
 * - Title "Reminder for <name>"
 * - Read-only formatted phone
 * - Editable textarea containing message (edits are local)
 * - Primary link "Open WhatsApp"
 * - Dynamic helper text:
 *   Before tap: "This opens WhatsApp with the message ready. Press Send in WhatsApp."
 *   After tap: "WhatsApp opened. Press Send there."
 */
export function ReminderSheet({
  open,
  onOpenChange,
  customerName,
  phone,
  balance,
  defaultMessage,
  error,
}: ReminderSheetProps) {
  const [message, setMessage] = React.useState(defaultMessage);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = React.useState(false);

  React.useEffect(() => {
    setMessage(defaultMessage);
    setHasOpenedWhatsApp(false);
  }, [defaultMessage, open]);

  const canSend = !error && isStoredPhone(phone);
  const whatsappUrl = canSend ? buildWhatsAppUrl(phone, message) : null;

  const handleOpenWhatsApp = () => {
    setHasOpenedWhatsApp(true);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[var(--sheet)] max-w-lg mx-auto">
        <DrawerHeader className="border-b border-[var(--rule)] pb-4 text-left">
          <DrawerTitle className="text-[18px] sm:text-[22px] font-bold text-[var(--ink)]">
            Reminder for {customerName}
          </DrawerTitle>
          <DrawerDescription className="text-[14px] text-[var(--ink-soft)] mt-1">
            Mobile: {formatPhoneDisplay(phone)}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 flex flex-col gap-4">
          {error ? (
            <div className="p-4 bg-[var(--alert-wash)] text-[var(--alert-ink)] text-[14px] font-bold border border-[var(--rule)]">
              {error}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="reminder-message">Message text</Label>
              <Textarea
                id="reminder-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="font-normal text-[16px] bg-[var(--sheet)] resize-none"
              />
            </div>
          )}
        </div>

        <DrawerFooter className="flex flex-col gap-2 pt-2 pb-6">
          {canSend && whatsappUrl ? (
            <>
              <Button
                asChild
                variant="primary"
                size="default"
                className="w-full font-bold"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenWhatsApp}
                >
                  Open WhatsApp
                </a>
              </Button>
              <p className="text-[13px] text-[var(--ink-soft)] text-center mt-1">
                {hasOpenedWhatsApp
                  ? "WhatsApp opened. Press Send there."
                  : "This opens WhatsApp with the message ready. Press Send in WhatsApp."}
              </p>
            </>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
            className="w-full font-bold border-[var(--rule)]"
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
