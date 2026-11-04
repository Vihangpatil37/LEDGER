import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMINDER_TEMPLATE,
  renderReminder,
  validateReminderTemplate,
} from "@/lib/reminder";

describe("Reminder Library", () => {
  describe("RM-01: renderReminder placeholder substitution and validation", () => {
    it("renders placeholders with the saved name, formatted amount (1,250), and shop name", () => {
      const template = "Namaste {name} ji! ₹{amount} udhaar at {shop}. {unknown_tag}";
      const output = renderReminder(template, {
        name: "Rahul",
        amount: "1250.00",
        shop: "Chai Point",
      });

      expect(output).toBe("Namaste Rahul ji! ₹1,250 udhaar at Chai Point. {unknown_tag}");
    });

    it("leaves unknown placeholders untouched", () => {
      const template = "Hello {name}, your bill is ₹{amount}. Code: {secret_code}";
      const output = renderReminder(template, {
        name: "Amit",
        amount: "500",
        shop: null,
      });

      expect(output).toBe("Hello Amit, your bill is ₹500. Code: {secret_code}");
    });

    it("replaces {shop} with empty string when shop is null", () => {
      const template = "Udhaar at {shop}: ₹{amount} for {name}";
      const output = renderReminder(template, {
        name: "Jay",
        amount: "300",
        shop: null,
      });

      expect(output).toBe("Udhaar at : ₹300 for Jay");
    });

    it("trims and caps result at 1000 characters", () => {
      const longTemplate = "{name} " + "A".repeat(1200);
      const output = renderReminder(longTemplate, {
        name: "Test",
        amount: "100",
        shop: null,
      });
      expect(output.length).toBeLessThanOrEqual(1000);
    });

    it("renders default Hinglish reminder template properly", () => {
      const rendered = renderReminder(DEFAULT_REMINDER_TEMPLATE, {
        name: "Rahul Patel",
        amount: "1150.00",
        shop: "Chai Ledger",
      });
      expect(rendered).toContain("Rahul Patel");
      expect(rendered).toContain("₹1,150");
      expect(rendered).toContain("🙏");
    });

    describe("validateReminderTemplate for Settings", () => {
      it("accepts valid template with required placeholders {name} and {amount}", () => {
        const result = validateReminderTemplate("Hello {name}, you owe ₹{amount} to {shop}.");
        expect(result.valid).toBe(true);
      });

      it("rejects a template missing {amount}", () => {
        const result = validateReminderTemplate("Hello {name}, your bill is ready.");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("{amount}");
      });

      it("rejects a template missing {name}", () => {
        const result = validateReminderTemplate("You owe ₹{amount} to Chai Point.");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("{name}");
      });

      it("rejects a template containing unknown placeholders", () => {
        const result = validateReminderTemplate("Hello {name}, pay ₹{amount} or {penalty}.");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("{penalty}");
      });

      it("rejects templates shorter than 10 characters", () => {
        const result = validateReminderTemplate("Too short");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("at least 10 characters");
      });
    });
  });
});
