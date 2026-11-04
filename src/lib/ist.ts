/**
 * IST (India Standard Time - Asia/Kolkata) date and time utilities.
 * Every displayed date and "today" calculation must use Asia/Kolkata timezone (D-13).
 */

const IST_TIMEZONE = "Asia/Kolkata";

function getISTYear(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
  }).formatToParts(d);
  return parseInt(parts.find((p) => p.type === "year")?.value ?? "0", 10);
}

function getISTDayNumber(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const year = parseInt(parts.find((p) => p.type === "year")?.value ?? "0", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value ?? "0", 10);
  const day = parseInt(parts.find((p) => p.type === "day")?.value ?? "0", 10);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function formatISTTime(d: Date): string {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter
    .format(d)
    .replace(/\u202f/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function formatISTDate(d: Date, referenceDate: Date = new Date()): string {
  const isCurrentYear = getISTYear(d) === getISTYear(referenceDate);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
  });
  const dayMonth = formatter.format(d);
  return isCurrentYear ? dayMonth : `${dayMonth} ${getISTYear(d)}`;
}

export function formatISTDateTime(d: Date, referenceDate: Date = new Date()): string {
  const dateStr = formatISTDate(d, referenceDate);
  const timeStr = formatISTTime(d);
  return `${dateStr}, ${timeStr}`;
}

/**
 * Formats an ISO string or Date into IST representation.
 * - time: "6:42 pm"
 * - date: "4 Nov" (or "4 Nov 2025" if not current year)
 * - datetime: "4 Nov, 6:42 pm"
 */
export function formatIST(
  iso: string | Date,
  format: "time" | "date" | "datetime",
  referenceDate: Date = new Date()
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "";
  switch (format) {
    case "time":
      return formatISTTime(d);
    case "date":
      return formatISTDate(d, referenceDate);
    case "datetime":
      return formatISTDateTime(d, referenceDate);
  }
}

/**
 * Returns "Today", "Yesterday", or formatted date ("4 Nov"),
 * comparing calendar days in IST.
 */
export function dayLabelIST(
  iso: string | Date,
  referenceDate: Date = new Date()
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "";
  const targetDay = getISTDayNumber(d);
  const refDay = getISTDayNumber(referenceDate);
  const diff = refDay - targetDay;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatISTDate(d, referenceDate);
}
