import { z } from "zod";
import { amountString } from "./common";

export type Settings = {
  shopName: string | null;
  ownerName: string | null;
  phone: string | null;
  defaultAlertStep: string;
  reminderTemplate: string;
};

export type ReminderDraft = {
  customerId: string;
  customerName: string;
  phone: string;
  balance: string;
  message: string;
};

export const updateSettingsSchema = z.object({
  shopName: z
    .string()
    .trim()
    .max(60, "Shop name must be at most 60 characters")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  ownerName: z
    .string()
    .trim()
    .max(60, "Owner name must be at most 60 characters")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  defaultAlertStep: amountString,
  reminderTemplate: z
    .string()
    .min(10, "Template must be at least 10 characters")
    .max(800, "Template must be at most 800 characters"),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
