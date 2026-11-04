import { describe, expect, it } from "vitest";
import {
  formatAmount,
  mapCustomerBalance,
  mapLedgerEntry,
} from "@/lib/server/mappers";

describe("Server Mappers", () => {
  describe("formatAmount", () => {
    it("formats numbers to two-decimal strings", () => {
      expect(formatAmount(50)).toBe("50.00");
      expect(formatAmount(1250.5)).toBe("1250.50");
      expect(formatAmount(0)).toBe("0.00");
      expect(formatAmount(-200)).toBe("-200.00");
    });

    it("handles string representations and edge cases", () => {
      expect(formatAmount("100")).toBe("100.00");
      expect(formatAmount("100.25")).toBe("100.25");
      expect(formatAmount(null)).toBe("0.00");
      expect(formatAmount(undefined)).toBe("0.00");
      expect(formatAmount("invalid")).toBe("0.00");
    });
  });

  describe("mapCustomerBalance", () => {
    it("maps raw DB row to CustomerBalance contract with formatted amounts", () => {
      const raw = {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Rahul Patel",
        phone: "919876543210",
        alert_step: 500,
        is_active: true,
        balance: 1150,
        status: "ALERT" as const,
        alert_level: 2,
        last_activity_at: "2026-11-04T13:12:00.000Z",
        created_at: "2026-10-01T04:30:00.000Z",
        updated_at: "2026-11-04T13:12:00.000Z",
      };

      const result = mapCustomerBalance(raw);
      expect(result.id).toBe(raw.id);
      expect(result.alertStep).toBe("500.00");
      expect(result.balance).toBe("1150.00");
      expect(result.isActive).toBe(true);
      expect(result.status).toBe("ALERT");
    });
  });

  describe("mapLedgerEntry", () => {
    it("maps raw DB view row to LedgerEntry contract with formatted amounts", () => {
      const raw = {
        id: "a1111111-1111-4111-8111-111111111111",
        customer_id: "11111111-1111-4111-8111-111111111111",
        customer_name: "Rahul Patel",
        type: "CREDIT" as const,
        amount: 50,
        description: "Chai",
        is_reversal: false,
        reversal_of: null,
        is_reversed: false,
        advance_confirmed: false,
        running_balance: 1150,
        created_at: "2026-11-04T13:12:00.000Z",
      };

      const result = mapLedgerEntry(raw);
      expect(result.amount).toBe("50.00");
      expect(result.runningBalance).toBe("1150.00");
      expect(result.isReversal).toBe(false);
    });
  });
});
