import { z } from "zod";

export const APP_ERROR_CODES = [
  "UNAUTHENTICATED",
  "VALIDATION_FAILED",
  "AMOUNT_OUT_OF_RANGE",
  "INVALID_PHONE",
  "DUPLICATE_PHONE",
  "CUSTOMER_NOT_FOUND",
  "CUSTOMER_INACTIVE",
  "ADVANCE_CONFIRMATION_REQUIRED",
  "TRANSACTION_NOT_FOUND",
  "ALREADY_REVERSED",
  "CANNOT_REVERSE_REVERSAL",
  "NO_BALANCE_DUE",
  "INVALID_CREDENTIALS",
  "INTERNAL",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: AppErrorCode;
        message: string;
        fieldErrors?: Record<string, string>;
        details?: unknown;
      };
    };

export const uuid = z.string().uuid();

// Amount arrives as a string. The UI strips ₹, commas and spaces before sending.
export const amountString = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter an amount like 50 or 50.50")
  .refine(
    (v) => Number(v) > 0 && Number(v) <= 100000,
    "Amount must be between ₹0.01 and ₹1,00,000"
  );

export const noteString = z
  .string()
  .trim()
  .max(140, "Keep the note under 140 characters")
  .transform((v) => (v === "" ? null : v))
  .nullable();
