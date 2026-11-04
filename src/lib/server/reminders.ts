import type { ActionResult } from "../contracts/common";
import type { ReminderDraft } from "../contracts/settings";
import { isStoredPhone } from "../phone";
import { renderReminder } from "../reminder";
import { getCustomer } from "./customers";
import { getSettings } from "./settings";

/**
 * Generates a pre-filled WhatsApp reminder draft for a customer.
 * Enforces business rules:
 * - Customer must exist and belong to owner (CUSTOMER_NOT_FOUND).
 * - Balance must be strictly greater than 0 (NO_BALANCE_DUE).
 * - Stored phone must be valid canonical format (INVALID_PHONE).
 * Reminder message renders the owner's template with live name, balance, and shop name.
 */
export async function getReminderDraft(
  customerId: string
): Promise<ActionResult<ReminderDraft>> {
  const customer = await getCustomer(customerId);
  if (!customer) {
    return {
      ok: false,
      error: {
        code: "CUSTOMER_NOT_FOUND",
        message: "This customer does not exist or is not yours.",
      },
    };
  }

  const balanceNumber = Number(customer.balance);
  if (balanceNumber <= 0) {
    return {
      ok: false,
      error: {
        code: "NO_BALANCE_DUE",
        message: "Nothing is due.",
      },
    };
  }

  if (!isStoredPhone(customer.phone)) {
    return {
      ok: false,
      error: {
        code: "INVALID_PHONE",
        message: "Fix the mobile number to send a reminder.",
      },
    };
  }

  const settings = await getSettings();

  const message = renderReminder(settings.reminderTemplate, {
    name: customer.name,
    amount: customer.balance,
    shop: settings.shopName,
  });

  return {
    ok: true,
    data: {
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      balance: customer.balance,
      message,
    },
  };
}
