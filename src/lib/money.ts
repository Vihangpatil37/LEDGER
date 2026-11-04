/**
 * Pure money utilities for Chai Ledger.
 * Rule: Never use floating-point numbers for money arithmetic.
 * All arithmetic uses integer paise.
 */

/**
 * Strips ₹, commas, and spaces.
 * Must match ^\d{1,6}(\.\d{1,2})?$, greater than 0, at most 100000.
 * Returns integer paise or null.
 */
export function parseAmountToPaise(input: string): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  const [wholeStr, fracStr = ""] = cleaned.split(".");
  const whole = parseInt(wholeStr, 10);
  const paiseFrac = parseInt((fracStr + "00").slice(0, 2), 10);
  const totalPaise = whole * 100 + paiseFrac;
  if (totalPaise <= 0 || totalPaise > 100000 * 100) {
    return null;
  }
  return totalPaise;
}

/**
 * Converts integer paise to two-decimal string: 5000 -> "50.00".
 */
export function paiseToString(p: number): string {
  const isNegative = p < 0;
  const abs = Math.abs(Math.round(p));
  const rupees = Math.floor(abs / 100);
  const paise = abs % 100;
  return `${isNegative ? "-" : ""}${rupees}.${paise.toString().padStart(2, "0")}`;
}

/**
 * Parses a server money string (may be negative) to integer paise.
 * Examples: "50.00" -> 5000, "-200.00" -> -20000.
 */
export function moneyToPaise(s: string): number {
  if (typeof s !== "string") return 0;
  const trimmed = s.trim();
  const isNegative = trimmed.startsWith("-");
  const clean = isNegative ? trimmed.slice(1) : trimmed;
  const [wholeStr, fracStr = "0"] = clean.split(".");
  const whole = parseInt(wholeStr, 10) || 0;
  const frac = parseInt((fracStr + "00").slice(0, 2), 10) || 0;
  const paise = whole * 100 + frac;
  return isNegative ? -paise : paise;
}

/**
 * Formats a money string in en-IN grouping without the ₹ symbol.
 * No decimals when paise is zero ("1,250"); otherwise two decimals ("1,250.50").
 * Lakh grouping: "100000.00" -> "1,00,000".
 * Negative values keep a leading minus.
 */
export function formatINRPlain(s: string): string {
  const paise = moneyToPaise(s);
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remPaise = absPaise % 100;
  const rupeePart = new Intl.NumberFormat("en-IN", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(rupees);
  const formatted =
    remPaise === 0
      ? rupeePart
      : `${rupeePart}.${remPaise.toString().padStart(2, "0")}`;
  return `${isNegative ? "-" : ""}${formatted}`;
}

/**
 * Formats a money string in en-IN grouping with ₹ symbol.
 * No decimals when paise is zero ("₹1,250"); otherwise two decimals ("₹1,250.50").
 * Lakh grouping: "100000.00" -> "₹1,00,000".
 * Negative values keep a leading minus: "-200.00" -> "-₹200".
 */
export function formatINR(s: string): string {
  const plain = formatINRPlain(s);
  if (plain.startsWith("-")) {
    return `-₹${plain.slice(1)}`;
  }
  return `₹${plain}`;
}
