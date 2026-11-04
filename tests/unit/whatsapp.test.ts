import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

describe("WhatsApp Library", () => {
  describe("WA-01: buildWhatsAppUrl formatting and encoding", () => {
    it("builds wa.me URL with phone and URL-encoded message including emoji and newlines", () => {
      const phone = "919876543210";
      const message = "Namaste Rahul ji! 🙏\n\nAapke account mein ₹1,250 ka udhaar pending hai.";
      const url = buildWhatsAppUrl(phone, message);

      expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);

      const encodedText = url.replace("https://wa.me/919876543210?text=", "");
      expect(decodeURIComponent(encodedText)).toBe(message);

      // Verify that newline and emoji were encoded
      expect(encodedText).toContain("%0A");
      expect(encodedText).toContain("%F0%9F%99%8F"); // 🙏 encoded
    });
  });

  describe("WA-02: buildWhatsAppUrl error handling", () => {
    it("throws Error('INVALID_PHONE') if storedPhone is not valid 12-digit stored format", () => {
      expect(() => buildWhatsAppUrl("9876543210", "Hello")).toThrowError("INVALID_PHONE");
      expect(() => buildWhatsAppUrl("+91 98765 43210", "Hello")).toThrowError("INVALID_PHONE");
      expect(() => buildWhatsAppUrl("915876543210", "Hello")).toThrowError("INVALID_PHONE");
      expect(() => buildWhatsAppUrl("", "Hello")).toThrowError("INVALID_PHONE");
    });
  });
});
