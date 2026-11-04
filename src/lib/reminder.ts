import { formatINRPlain } from "./money";

export const DEFAULT_REMINDER_TEMPLATE = `Namaste {name} ji! 🙏\n\nAapke account mein ₹{amount} ka udhaar pending hai.\n\nKripya apna pending payment clear kar dein.\n\nDhanyavaad!`;

export const ALLOWED_PLACEHOLDERS = ["name", "amount", "shop"] as const;

/**
 * Replaces placeholders in the reminder template:
 * - {name} -> customer name
 * - {amount} -> formatINRPlain(amount)
 * - {shop} -> shop name or ""
 * Unknown placeholders are left as typed.
 * The result is trimmed and capped at 1000 characters.
 */
export function renderReminder(
  template: string,
  v: { name: string; amount: string; shop: string | null }
): string {
  if (typeof template !== "string") return "";

  const rendered = template.replace(/\{([^{}]+)\}/g, (match, key) => {
    switch (key) {
      case "name":
        return v.name;
      case "amount":
        return formatINRPlain(v.amount);
      case "shop":
        return v.shop ?? "";
      default:
        return match;
    }
  });

  return rendered.trim().slice(0, 1000);
}

/**
 * Validates a reminder template for Settings:
 * - Must be between 10 and 800 characters
 * - Must contain {name}
 * - Must contain {amount}
 * - Can only contain allowed placeholders: {name}, {amount}, {shop}
 */
export function validateReminderTemplate(template: string): {
  valid: boolean;
  error?: string;
} {
  if (typeof template !== "string" || template.trim().length < 10) {
    return {
      valid: false,
      error: "Template must be at least 10 characters long.",
    };
  }

  if (template.length > 800) {
    return {
      valid: false,
      error: "Template must be at most 800 characters long.",
    };
  }

  if (!template.includes("{name}")) {
    return {
      valid: false,
      error: "Template must include the {name} placeholder.",
    };
  }

  if (!template.includes("{amount}")) {
    return {
      valid: false,
      error: "Template must include the {amount} placeholder.",
    };
  }

  const placeholderRegex = /\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(template)) !== null) {
    const key = match[1];
    if (
      key !== "name" &&
      key !== "amount" &&
      key !== "shop"
    ) {
      return {
        valid: false,
        error: `Unknown placeholder {${key}}. Only {name}, {amount}, and {shop} are allowed.`,
      };
    }
  }

  return { valid: true };
}
