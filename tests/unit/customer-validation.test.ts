import { describe, expect, it } from "vitest";
import {
  createCustomerSchema,
  setCustomerActiveSchema,
  updateCustomerSchema,
} from "@/lib/contracts/customers";
import { normalizePhone } from "@/lib/phone";
import { findDuplicateCustomers } from "@/app/(app)/customers/actions";

describe("Customer Validation & Business Rules", () => {
  describe("Name validation boundaries (1..80 characters)", () => {
    it("accepts valid 1-character and 80-character trimmed names", () => {
      const minInput = {
        name: "A",
        phone: "9876543210",
        alertStep: "500",
      };
      expect(createCustomerSchema.safeParse(minInput).success).toBe(true);

      const maxInput = {
        name: "A".repeat(80),
        phone: "9876543210",
        alertStep: "500",
      };
      expect(createCustomerSchema.safeParse(maxInput).success).toBe(true);
    });

    it("rejects empty names or whitespace-only names", () => {
      const emptyInput = {
        name: "",
        phone: "9876543210",
        alertStep: "500",
      };
      expect(createCustomerSchema.safeParse(emptyInput).success).toBe(false);

      const spaceInput = {
        name: "    ",
        phone: "9876543210",
        alertStep: "500",
      };
      expect(createCustomerSchema.safeParse(spaceInput).success).toBe(false);
    });

    it("rejects names longer than 80 characters", () => {
      const longInput = {
        name: "A".repeat(81),
        phone: "9876543210",
        alertStep: "500",
      };
      expect(createCustomerSchema.safeParse(longInput).success).toBe(false);
    });
  });

  describe("Alert step validation boundaries (must be > 0 and <= 1,00,000, max 2 decimals)", () => {
    it("accepts valid alert step values", () => {
      const validSteps = ["500", "500.00", "100", "0.01", "100000"];
      for (const step of validSteps) {
        const input = {
          name: "Test Customer",
          phone: "9876543210",
          alertStep: step,
        };
        const parsed = createCustomerSchema.safeParse(input);
        expect(parsed.success).toBe(true);
      }
    });

    it("rejects zero or negative alert steps", () => {
      const invalidSteps = ["0", "0.00", "-100", "-500.00"];
      for (const step of invalidSteps) {
        const input = {
          name: "Test Customer",
          phone: "9876543210",
          alertStep: step,
        };
        const parsed = createCustomerSchema.safeParse(input);
        expect(parsed.success).toBe(false);
      }
    });

    it("rejects alert steps with more than 2 decimal places or non-numeric values", () => {
      const invalidFormats = ["500.123", "abc", "500,00", ""];
      for (const step of invalidFormats) {
        const input = {
          name: "Test Customer",
          phone: "9876543210",
          alertStep: step,
        };
        const parsed = createCustomerSchema.safeParse(input);
        expect(parsed.success).toBe(false);
      }
    });

    it("rejects alert steps greater than 1,00,000", () => {
      const input = {
        name: "Test Customer",
        phone: "9876543210",
        alertStep: "100000.01",
      };
      expect(createCustomerSchema.safeParse(input).success).toBe(false);
    });
  });

  describe("Phone normalization for customer records", () => {
    it("normalizes standard Indian formats to canonical 91XXXXXXXXXX", () => {
      expect(normalizePhone("9876543210")).toBe("919876543210");
      expect(normalizePhone("09876543210")).toBe("919876543210");
      expect(normalizePhone("+91 98765 43210")).toBe("919876543210");
      expect(normalizePhone("0091 98765 43210")).toBe("919876543210");
    });

    it("rejects invalid mobile numbers", () => {
      expect(normalizePhone("5876543210")).toBeNull();
      expect(normalizePhone("12345")).toBeNull();
      expect(normalizePhone("")).toBeNull();
    });
  });

  describe("Update & Active status schemas", () => {
    it("validates update customer schema requiring a valid UUID", () => {
      const valid = {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Rahul Patel",
        phone: "9876543210",
        alertStep: "500.00",
        confirmDuplicate: false,
      };
      expect(updateCustomerSchema.safeParse(valid).success).toBe(true);

      const invalidId = {
        ...valid,
        id: "not-a-uuid",
      };
      expect(updateCustomerSchema.safeParse(invalidId).success).toBe(false);
    });

    it("validates set customer active schema", () => {
      expect(
        setCustomerActiveSchema.safeParse({
          id: "11111111-1111-4111-8111-111111111111",
          isActive: false,
        }).success
      ).toBe(true);

      expect(
        setCustomerActiveSchema.safeParse({
          id: "invalid",
          isActive: true,
        }).success
      ).toBe(false);
    });
  });

  describe("findDuplicateCustomers detection logic", () => {
    it("finds existing customers matching phone for the same owner", async () => {
      const mockRows = [
        { id: "cust-1", name: "Rahul Patel", is_active: true },
      ];

      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: mockRows, error: null }),
            }),
          }),
        }),
      };

      const duplicates = await findDuplicateCustomers(
        mockSupabase,
        "owner-123",
        "919876543210"
      );

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toEqual({
        id: "cust-1",
        name: "Rahul Patel",
        isActive: true,
      });
    });

    it("excludes the record being edited when excludeId is provided", async () => {
      let neqCalledWith = "";
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                neq: (_col: string, val: string) => {
                  neqCalledWith = val;
                  return Promise.resolve({ data: [], error: null });
                },
              }),
            }),
          }),
        }),
      };

      const duplicates = await findDuplicateCustomers(
        mockSupabase,
        "owner-123",
        "919876543210",
        "cust-1"
      );

      expect(neqCalledWith).toBe("cust-1");
      expect(duplicates).toHaveLength(0);
    });
  });
});
