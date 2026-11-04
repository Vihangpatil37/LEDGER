import { describe, expect, it } from "vitest";
import {
  formatINR,
  formatINRPlain,
  moneyToPaise,
  paiseToString,
  parseAmountToPaise,
} from "@/lib/money";

describe("Money Library", () => {
  describe("M-01: parseAmountToPaise valid inputs", () => {
    it("parses integer rupee string to paise", () => {
      expect(parseAmountToPaise("50")).toBe(5000);
    });

    it("parses single decimal digit rupee string to paise", () => {
      expect(parseAmountToPaise("50.5")).toBe(5050);
    });

    it("parses rupee string with currency symbol, commas, and two decimals", () => {
      expect(parseAmountToPaise("₹1,250.25")).toBe(125025);
    });

    it("handles boundary value 100000 correctly", () => {
      expect(parseAmountToPaise("100000")).toBe(10000000);
      expect(parseAmountToPaise("100000.00")).toBe(10000000);
    });

    it("handles minimum amount 0.01 correctly", () => {
      expect(parseAmountToPaise("0.01")).toBe(1);
    });
  });

  describe("M-02: parseAmountToPaise invalid inputs", () => {
    it("rejects zero", () => {
      expect(parseAmountToPaise("0")).toBeNull();
      expect(parseAmountToPaise("0.00")).toBeNull();
    });

    it("rejects negative amounts", () => {
      expect(parseAmountToPaise("-5")).toBeNull();
    });

    it("rejects non-numeric strings", () => {
      expect(parseAmountToPaise("abc")).toBeNull();
    });

    it("rejects more than 2 decimal places", () => {
      expect(parseAmountToPaise("1.234")).toBeNull();
    });

    it("rejects amounts greater than 1,00,000", () => {
      expect(parseAmountToPaise("100000.01")).toBeNull();
      expect(parseAmountToPaise("100001")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(parseAmountToPaise("")).toBeNull();
    });
  });

  describe("M-03: formatINR & formatINRPlain Indian numbering", () => {
    it("formats 100000.00 with Indian lakh grouping and ₹ symbol", () => {
      expect(formatINR("100000.00")).toBe("₹1,00,000");
    });

    it("formats 1250.50 with two decimals and ₹ symbol", () => {
      expect(formatINR("1250.50")).toBe("₹1,250.50");
    });

    it("formats integer amounts without decimals when paise is zero", () => {
      expect(formatINR("1250.00")).toBe("₹1,250");
      expect(formatINR("1250")).toBe("₹1,250");
    });

    it("keeps leading minus for negative values", () => {
      expect(formatINR("-200.00")).toBe("-₹200");
      expect(formatINR("-200.50")).toBe("-₹200.50");
    });

    it("formatINRPlain formats without ₹ symbol", () => {
      expect(formatINRPlain("1250.00")).toBe("1,250");
      expect(formatINRPlain("100000.00")).toBe("1,00,000");
      expect(formatINRPlain("-200.00")).toBe("-200");
    });
  });

  describe("paiseToString and moneyToPaise helpers", () => {
    it("converts paise to string", () => {
      expect(paiseToString(5000)).toBe("50.00");
      expect(paiseToString(5050)).toBe("50.50");
      expect(paiseToString(5)).toBe("0.05");
      expect(paiseToString(0)).toBe("0.00");
      expect(paiseToString(-20000)).toBe("-200.00");
    });

    it("converts server money string to paise", () => {
      expect(moneyToPaise("50.00")).toBe(5000);
      expect(moneyToPaise("-200.00")).toBe(-20000);
      expect(moneyToPaise("1250.50")).toBe(125050);
      expect(moneyToPaise("0.00")).toBe(0);
    });
  });
});
