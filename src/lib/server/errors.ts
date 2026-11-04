import {
  APP_ERROR_CODES,
  type ActionResult,
  type AppErrorCode,
} from "../contracts/common";
import { AppAuthError } from "./auth";

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: "Please log in to continue.",
  VALIDATION_FAILED: "Please check the entered details.",
  AMOUNT_OUT_OF_RANGE: "Amount must be between ₹0.01 and ₹1,00,000.",
  INVALID_PHONE: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
  DUPLICATE_PHONE: "This number is already saved for another customer.",
  CUSTOMER_NOT_FOUND: "This customer does not exist or is not yours.",
  CUSTOMER_INACTIVE: "Inactive. New udhaar is blocked.",
  ADVANCE_CONFIRMATION_REQUIRED: "Payment is more than the balance.",
  TRANSACTION_NOT_FOUND: "This entry could not be found.",
  ALREADY_REVERSED: "This entry has already been reversed.",
  CANNOT_REVERSE_REVERSAL: "Cannot reverse a reversal entry.",
  NO_BALANCE_DUE: "Nothing is due.",
  INVALID_CREDENTIALS: "Email or password is wrong.",
  INTERNAL: "Could not save. Nothing was changed. Try again.",
};

export function isAppErrorCode(code: string): code is AppErrorCode {
  return (APP_ERROR_CODES as readonly string[]).includes(code);
}

export function getDefaultErrorMessage(code: AppErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.INTERNAL;
}

/**
 * Maps server errors (PostgREST, RPC, Auth, or unexpected exceptions)
 * to standard ActionResult error shapes.
 *
 * Rules:
 * - If error.message matches an AppErrorCode, use that code.
 * - If error.details is present (JSON string or object), parse into details.
 * - Unknown errors are logged server-side (without sensitive customer data) and mapped to INTERNAL.
 * - Actions never throw to the client.
 */
export function handleServerError<T = never>(
  err: unknown,
  overrideMessage?: string
): ActionResult<T> {
  if (err instanceof AppAuthError || (err as { message?: string })?.message === "UNAUTHENTICATED") {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: ERROR_MESSAGES.UNAUTHENTICATED,
      },
    };
  }

  if (err && typeof err === "object") {
    const errorObj = err as {
      message?: string;
      code?: string;
      details?: unknown;
      hint?: string;
    };

    const message = errorObj.message || "";

    if (isAppErrorCode(message)) {
      let details: unknown = undefined;
      if (typeof errorObj.details === "string") {
        try {
          details = JSON.parse(errorObj.details);
        } catch {
          details = errorObj.details;
        }
      } else if (errorObj.details) {
        details = errorObj.details;
      }

      if (details && typeof details === "object") {
        const d = details as Record<string, any>;
        if (d.advance_after !== undefined && d.advanceAfter === undefined) {
          d.advanceAfter = d.advance_after;
        }
      }

      return {
        ok: false,
        error: {
          code: message,
          message: overrideMessage || ERROR_MESSAGES[message],
          details,
        },
      };
    }
  }

  // Server-side logging without phone numbers or money amounts
  const sanitizedMsg =
    err instanceof Error
      ? err.message.replace(/\d{10,14}/g, "[REDACTED_PHONE]")
      : "Unknown error occurred";
  console.error("[ChaiLedger Server Error]:", sanitizedMsg);

  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message: ERROR_MESSAGES.INTERNAL,
    },
  };
}
