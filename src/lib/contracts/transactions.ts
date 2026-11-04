import { z } from "zod";
import { amountString, noteString, uuid } from "./common";

export type LedgerEntry = {
  id: string;
  customerId: string;
  customerName: string;
  type: "CREDIT" | "PAYMENT";
  amount: string;
  description: string | null;
  isReversal: boolean;
  reversalOf: string | null;
  isReversed: boolean;
  advanceConfirmed: boolean;
  runningBalance: string;
  createdAt: string;
};

export type CreateTransactionResult = {
  replayed: boolean;
  transaction: {
    id: string;
    type: "CREDIT" | "PAYMENT";
    amount: string;
    description: string | null;
    createdAt: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    alertStep: string;
  };
  balanceBefore: string | null;
  balanceAfter: string;
  alert: {
    level: number;
    crossedAmount: string;
  } | null;
};

export type ReverseTransactionResult = {
  replayed: boolean;
  originalId: string;
  balanceAfter: string;
  reversal: {
    id: string;
    type: "CREDIT" | "PAYMENT";
    amount: string;
    description: string;
    createdAt: string;
  };
};

export const createTransactionSchema = z.object({
  customerId: uuid,
  type: z.enum(["CREDIT", "PAYMENT"]),
  amount: amountString,
  description: noteString,
  idempotencyKey: uuid,
  confirmAdvance: z.boolean().default(false),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const reverseTransactionSchema = z.object({
  transactionId: uuid,
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(140, "Keep the reason under 140 characters"),
  idempotencyKey: uuid,
});
export type ReverseTransactionInput = z.infer<typeof reverseTransactionSchema>;
