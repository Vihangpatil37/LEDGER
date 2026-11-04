import { describe, expect, it } from "vitest";
import { formatPhoneDisplay, isStoredPhone, normalizePhone } from "@/lib/phone";

describe("Phone Library", () => {
  describe("PH-01: normalizePhone valid variations", () => {
    it("normalizes 10-digit number starting with 9", () => {
      expect(normalizePhone("9876543210")).toBe("919876543210");
    });

    it("normalizes 11-digit number with leading 0", () => {
      expect(normalizePhone("09876543210")).toBe("919876543210");
    });

    it("normalizes 12-digit number starting with 91", () => {
      expect(normalizePhone("919876543210")).toBe("919876543210");
    });

    it("normalizes number with country code, plus sign, spaces, and hyphens", () => {
      expect(normalizePhone("+91 98765-43210")).toBe("919876543210");
    });

    it("normalizes 14-digit number starting with 0091 and spaces", () => {
      expect(normalizePhone("0091 98765 43210")).toBe("919876543210");
    });

    it("accepts valid starting digits 6, 7, 8, and 9", () => {
      expect(normalizePhone("6123456789")).toBe("916123456789");
      expect(normalizePhone("7123456789")).toBe("917123456789");
      expect(normalizePhone("8123456789")).toBe("918123456789");
      expect(normalizePhone("9123456789")).toBe("919123456789");
    });
  });

  describe("PH-02: normalizePhone invalid inputs", () => {
    it("rejects 10-digit numbers starting with 1-5", () => {
      expect(normalizePhone("5876543210")).toBeNull();
      expect(normalizePhone("1234567890")).toBeNull();
    });

    it("rejects numbers that are too short", () => {
      expect(normalizePhone("98765")).toBeNull();
    });

    it("rejects numbers that are too long without valid prefix", () => {
      expect(normalizePhone("98765432101")).toBeNull();
    });

    it("rejects alphabetic / non-numeric input", () => {
      expect(normalizePhone("abcdefghij")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(normalizePhone("")).toBeNull();
    });
  });

  describe("isStoredPhone and formatPhoneDisplay", () => {
    it("validates canonical 12-digit stored phone format", () => {
      expect(isStoredPhone("919876543210")).toBe(true);
      expect(isStoredPhone("9876543210")).toBe(false);
      expect(isStoredPhone("915876543210")).toBe(false);
    });

    it("formats stored phone for display", () => {
      expect(formatPhoneDisplay("919876543210")).toBe("+91 98765 43210");
    });

    it("returns invalid input unchanged in formatPhoneDisplay", () => {
      expect(formatPhoneDisplay("invalid")).toBe("invalid");
    });
  });
});
