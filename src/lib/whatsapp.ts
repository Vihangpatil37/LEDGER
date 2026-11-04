import { isStoredPhone } from "./phone";

/**
 * Builds a WhatsApp Click to Chat URL (wa.me).
 * Throws Error("INVALID_PHONE") if storedPhone is not in stored format (91XXXXXXXXXX).
 * The UI renders this as a standard <a href target="_blank" rel="noopener noreferrer">.
 */
export function buildWhatsAppUrl(storedPhone: string, message: string): string {
  if (!isStoredPhone(storedPhone)) {
    throw new Error("INVALID_PHONE");
  }
  return `https://wa.me/${storedPhone}?text=${encodeURIComponent(message)}`;
}
