/**
 * Phone number utilities for Chai Ledger.
 * Stored form is always 12 digits: 91XXXXXXXXXX (e.g. 919876543210).
 */

/**
 * Normalizes input to 12-digit stored format: 91XXXXXXXXXX.
 * Accepts:
 * - 10 digits starting with 6-9
 * - 11 digits starting with 0 followed by valid 10 digits
 * - 12 digits starting with 91 followed by valid 10 digits
 * - 14 digits starting with 0091 followed by valid 10 digits
 * Anything else returns null.
 */
export function normalizePhone(input: string): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  let valid10: string | null = null;

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    valid10 = digits;
  } else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    valid10 = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    valid10 = digits.slice(2);
  } else if (digits.length === 14 && digits.startsWith("0091") && /^[6-9]/.test(digits.slice(4))) {
    valid10 = digits.slice(4);
  }

  if (!valid10) return null;
  return `91${valid10}`;
}

/**
 * Checks if a string is in the canonical stored format: 91 + 10 digits (starting 6-9).
 */
export function isStoredPhone(s: string): boolean {
  if (typeof s !== "string") return false;
  return /^91[6-9][0-9]{9}$/.test(s);
}

/**
 * Formats stored phone for display: "+91 98765 43210".
 * If not matching stored format, returns the input string unchanged.
 */
export function formatPhoneDisplay(s: string): string {
  if (!isStoredPhone(s)) return s;
  return `+91 ${s.slice(2, 7)} ${s.slice(7, 12)}`;
}
