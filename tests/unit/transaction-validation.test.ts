import { describe, expect, it } from "vitest";
import {
  createTransactionSchema,
  reverseTransactionSchema,
} from "@/lib/contracts/transactions";
import {
  mapCreateTransactionResult,
  mapReverseTransactionResult,
} from "@/lib/server/mappers";

describe("Transaction Validation & RPC Mappers", () => {
  describe("createTransactionSchema", () => {
    const validBase = {
      customerId: "11111111-1111-4111-8111-111111111111",
      type: "CREDIT" as const,
      amount: "50.00",
      description: "Chai",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    };

    it("accepts valid credit and payment transactions", () => {
      expect(createTransactionSchema.safeParse(validBase).success).toBe(true);

      const payment = { ...validBase, type: "PAYMENT" as const };
      expect(createTransactionSchema.safeParse(payment).success).toBe(true);
    });

    it("transforms empty description to null and preserves notes up to 140 chars", () => {
      const withEmptyNote = { ...validBase, description: "   " };
      const parsedEmpty = createTransactionSchema.safeParse(withEmptyNote);
      expect(parsedEmpty.success).toBe(true);
      if (parsedEmpty.success) {
        expect(parsedEmpty.data.description).toBeNull();
      }

      const withLongNote = { ...validBase, description: "A".repeat(141) };
      expect(createTransactionSchema.safeParse(withLongNote).success).toBe(false);
    });

    it("rejects invalid amounts (0, negative, >100000, >2 decimals)", () => {
      expect(
        createTransactionSchema.safeParse({ ...validBase, amount: "0" }).success
      ).toBe(false);
      expect(
        createTransactionSchema.safeParse({ ...validBase, amount: "-50" }).success
      ).toBe(false);
      expect(
        createTransactionSchema.safeParse({
          ...validBase,
          amount: "100000.01",
        }).success
      ).toBe(false);
      expect(
        createTransactionSchema.safeParse({
          ...validBase,
          amount: "50.123",
        }).success
      ).toBe(false);
    });

    it("requires valid UUIDs for customerId and idempotencyKey", () => {
      expect(
        createTransactionSchema.safeParse({
          ...validBase,
          customerId: "not-a-uuid",
        }).success
      ).toBe(false);
      expect(
        createTransactionSchema.safeParse({
          ...validBase,
          idempotencyKey: "invalid",
        }).success
      ).toBe(false);
    });

    it("defaults confirmAdvance to false", () => {
      const parsed = createTransactionSchema.safeParse(validBase);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.confirmAdvance).toBe(false);
      }
    });
  });

  describe("reverseTransactionSchema", () => {
    const validReversal = {
      transactionId: "11111111-1111-4111-8111-111111111111",
      reason: "Wrong amount entered",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    };

    it("accepts valid reversal input with trimmed reason", () => {
      const parsed = reverseTransactionSchema.safeParse(validReversal);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.reason).toBe("Wrong amount entered");
      }
    });

    it("rejects reason shorter than 3 characters (DB-13 rule)", () => {
      expect(
        reverseTransactionSchema.safeParse({
          ...validReversal,
          reason: "ab",
        }).success
      ).toBe(false);

      expect(
        reverseTransactionSchema.safeParse({
          ...validReversal,
          reason: "   a   ",
        }).success
      ).toBe(false);
    });

    it("rejects reason longer than 140 characters", () => {
      expect(
        reverseTransactionSchema.safeParse({
          ...validReversal,
          reason: "R".repeat(141),
        }).success
      ).toBe(false);
    });
  });

  describe("RPC Mappers for Transactions", () => {
    it("maps create_transaction jsonb return value to CreateTransactionResult", () => {
      const rpcData = {
        replayed: false,
        transaction: {
          id: "txn-1",
          type: "CREDIT",
          amount: 50,
          description: "Chai",
          created_at: "2026-11-04T12:00:00.000Z",
        },
        customer: {
          id: "cust-1",
          name: "Rahul Patel",
          phone: "919876543210",
          alert_step: 500,
        },
        balance_before: 200,
        balance_after: 250,
        alert: {
          level: 1,
          crossed_amount: 500,
        },
      };

      const mapped = mapCreateTransactionResult(rpcData);
      expect(mapped.replayed).toBe(false);
      expect(mapped.transaction.amount).toBe("50.00");
      expect(mapped.customer.alertStep).toBe("500.00");
      expect(mapped.balanceBefore).toBe("200.00");
      expect(mapped.balanceAfter).toBe("250.00");
      expect(mapped.alert?.crossedAmount).toBe("500.00");
    });

    it("maps reverse_transaction jsonb return value to ReverseTransactionResult", () => {
      const rpcData = {
        replayed: false,
        reversal: {
          id: "rev-1",
          type: "PAYMENT",
          amount: 50,
          description: "Mistake",
          created_at: "2026-11-04T12:05:00.000Z",
        },
        original_id: "orig-1",
        balance_after: 200,
      };

      const mapped = mapReverseTransactionResult(rpcData);
      expect(mapped.replayed).toBe(false);
      expect(mapped.originalId).toBe("orig-1");
      expect(mapped.balanceAfter).toBe("200.00");
      expect(mapped.reversal.amount).toBe("50.00");
    });
  });
});
