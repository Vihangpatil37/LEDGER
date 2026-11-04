import { describe, expect, it } from "vitest";
import { updateSettingsSchema } from "@/lib/contracts/settings";
import { normalizePhone } from "@/lib/phone";
import { DEFAULT_REMINDER_TEMPLATE, validateReminderTemplate } from "@/lib/reminder";

describe("Settings Validation & Business Rules", () => {
  const validBase = {
    shopName: "Sharma Chai Stall",
    ownerName: "Ramesh Sharma",
    phone: "9812345678",
    defaultAlertStep: "500.00",
    reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
  };

  describe("updateSettingsSchema", () => {
    it("accepts valid complete settings input", () => {
      const parsed = updateSettingsSchema.safeParse(validBase);
      expect(parsed.success).toBe(true);
    });

    it("accepts null or omitted optional fields", () => {
      const minimal = {
        shopName: null,
        ownerName: null,
        phone: null,
        defaultAlertStep: "500",
        reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
      };
      const parsed = updateSettingsSchema.safeParse(minimal);
      expect(parsed.success).toBe(true);
    });

    it("transforms empty strings for shopName and ownerName to null", () => {
      const emptyNames = {
        ...validBase,
        shopName: "   ",
        ownerName: "",
      };
      const parsed = updateSettingsSchema.safeParse(emptyNames);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.shopName).toBeNull();
        expect(parsed.data.ownerName).toBeNull();
      }
    });

    it("rejects shopName longer than 60 characters", () => {
      const longShop = {
        ...validBase,
        shopName: "S".repeat(61),
      };
      expect(updateSettingsSchema.safeParse(longShop).success).toBe(false);
    });

    it("rejects ownerName longer than 60 characters", () => {
      const longOwner = {
        ...validBase,
        ownerName: "O".repeat(61),
      };
      expect(updateSettingsSchema.safeParse(longOwner).success).toBe(false);
    });

    it("validates defaultAlertStep with amountString rules", () => {
      expect(
        updateSettingsSchema.safeParse({ ...validBase, defaultAlertStep: "0" }).success
      ).toBe(false);
      expect(
        updateSettingsSchema.safeParse({ ...validBase, defaultAlertStep: "-500" }).success
      ).toBe(false);
      expect(
        updateSettingsSchema.safeParse({
          ...validBase,
          defaultAlertStep: "100000.01",
        }).success
      ).toBe(false);
      expect(
        updateSettingsSchema.safeParse({ ...validBase, defaultAlertStep: "500.123" }).success
      ).toBe(false);
      expect(
        updateSettingsSchema.safeParse({ ...validBase, defaultAlertStep: "500" }).success
      ).toBe(true);
    });
  });

  describe("Owner phone validation & normalization", () => {
    it("normalizes valid Indian phone numbers", () => {
      expect(normalizePhone("9812345678")).toBe("919812345678");
      expect(normalizePhone("+91 98123 45678")).toBe("919812345678");
      expect(normalizePhone("09812345678")).toBe("919812345678");
    });

    it("rejects invalid phone numbers", () => {
      expect(normalizePhone("1234567890")).toBeNull();
      expect(normalizePhone("5812345678")).toBeNull();
      expect(normalizePhone("invalid")).toBeNull();
    });
  });

  describe("Reminder template validation (validateReminderTemplate)", () => {
    it("accepts valid templates containing {name} and {amount}", () => {
      const t1 = "Namaste {name} ji, aapka bill ₹{amount} pending hai at {shop}.";
      expect(validateReminderTemplate(t1).valid).toBe(true);

      const t2 = "Hello {name}, please pay {amount}.";
      expect(validateReminderTemplate(t2).valid).toBe(true);
    });

    it("rejects template missing {name}", () => {
      const template = "Aapka udhaar ₹{amount} baki hai. Kripya pay karein.";
      const res = validateReminderTemplate(template);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("{name}");
    });

    it("rejects template missing {amount}", () => {
      const template = "Namaste {name} ji! Aapka payment pending hai.";
      const res = validateReminderTemplate(template);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("{amount}");
    });

    it("rejects template containing unauthorized placeholders", () => {
      const template = "Namaste {name} ji! ₹{amount} due on {due_date}.";
      const res = validateReminderTemplate(template);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("due_date");
    });

    it("rejects templates shorter than 10 characters", () => {
      const template = "Too short";
      const res = validateReminderTemplate(template);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("10");
    });

    it("rejects templates longer than 800 characters", () => {
      const template = "{name} {amount} " + "A".repeat(800);
      const res = validateReminderTemplate(template);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("800");
    });
  });
});
