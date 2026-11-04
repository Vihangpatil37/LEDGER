import { describe, it, expect } from "vitest";
import { moneyToPaise, paiseToString, formatINR } from "@/lib/money";

type TxnType = "CREDIT" | "PAYMENT";

interface TestTransaction {
  id: string;
  type: TxnType;
  amountPaise: number;
  isReversal: boolean;
  reversalOf: string | null;
  createdAt: number;
}

interface CustomerState {
  id: string;
  transactions: TestTransaction[];
  reversedTxnIds: Set<string>;
  idempotencyKeys: Set<string>;
  alertStepPaise: number;
}

function createCustomer(alertStepPaise: number = 50000): CustomerState {
  return {
    id: "cust-1",
    transactions: [],
    reversedTxnIds: new Set<string>(),
    idempotencyKeys: new Set<string>(),
    alertStepPaise,
  };
}

/**
 * Computes balance using the canonical SQL view formula:
 * SUM(case when type = 'CREDIT' then amount else -amount end)
 */
function computeSqlBalancePaise(transactions: TestTransaction[]): number {
  return transactions.reduce((acc, t) => {
    return acc + (t.type === "CREDIT" ? t.amountPaise : -t.amountPaise);
  }, 0);
}

/**
 * Computes balance using separate sums:
 * SUM(amount where type = 'CREDIT') - SUM(amount where type = 'PAYMENT')
 */
function computeSumFormulaPaise(transactions: TestTransaction[]): number {
  const sumCredit = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((acc, t) => acc + t.amountPaise, 0);
  const sumPayment = transactions
    .filter((t) => t.type === "PAYMENT")
    .reduce((acc, t) => acc + t.amountPaise, 0);
  return sumCredit - sumPayment;
}

/**
 * Derives customer status per Section 5.3:
 * balance < 0 => ADVANCE
 * balance = 0 => CLEAR
 * balance >= alert_step => ALERT
 * else => OWING
 */
function deriveStatus(balancePaise: number, alertStepPaise: number): "ADVANCE" | "CLEAR" | "ALERT" | "OWING" {
  if (balancePaise < 0) return "ADVANCE";
  if (balancePaise === 0) return "CLEAR";
  if (balancePaise >= alertStepPaise) return "ALERT";
  return "OWING";
}

/**
 * Simulates create_transaction RPC
 */
function applyTransaction(
  customer: CustomerState,
  params: {
    id: string;
    type: TxnType;
    amountPaise: number;
    idempotencyKey: string;
    confirmAdvance?: boolean;
  }
): { success: boolean; error?: string; replayed?: boolean } {
  if (customer.idempotencyKeys.has(params.idempotencyKey)) {
    return { success: true, replayed: true };
  }

  const currentBalance = computeSqlBalancePaise(customer.transactions);

  if (params.type === "PAYMENT" && params.amountPaise > currentBalance && !params.confirmAdvance) {
    return { success: false, error: "ADVANCE_CONFIRMATION_REQUIRED" };
  }

  const txn: TestTransaction = {
    id: params.id,
    type: params.type,
    amountPaise: params.amountPaise,
    isReversal: false,
    reversalOf: null,
    createdAt: Date.now(),
  };

  customer.transactions.push(txn);
  customer.idempotencyKeys.add(params.idempotencyKey);
  return { success: true, replayed: false };
}

/**
 * Simulates reverse_transaction RPC
 */
function applyReversal(
  customer: CustomerState,
  params: {
    id: string;
    targetTxnId: string;
    idempotencyKey: string;
    reason: string;
  }
): { success: boolean; error?: string; replayed?: boolean } {
  if (customer.idempotencyKeys.has(params.idempotencyKey)) {
    return { success: true, replayed: true };
  }

  if (params.reason.trim().length < 3) {
    return { success: false, error: "VALIDATION_FAILED" };
  }

  const target = customer.transactions.find((t) => t.id === params.targetTxnId);
  if (!target) {
    return { success: false, error: "TRANSACTION_NOT_FOUND" };
  }

  if (target.isReversal) {
    return { success: false, error: "CANNOT_REVERSE_REVERSAL" };
  }

  if (customer.reversedTxnIds.has(target.id)) {
    return { success: false, error: "ALREADY_REVERSED" };
  }

  // Opposite type, same amount
  const reversalTxn: TestTransaction = {
    id: params.id,
    type: target.type === "CREDIT" ? "PAYMENT" : "CREDIT",
    amountPaise: target.amountPaise,
    isReversal: true,
    reversalOf: target.id,
    createdAt: Date.now(),
  };

  customer.transactions.push(reversalTxn);
  customer.reversedTxnIds.add(target.id);
  customer.idempotencyKeys.add(params.idempotencyKey);
  return { success: true, replayed: false };
}

describe("Ledger Property Tests & Balance Invariants (Phase 3 P3-T4)", () => {
  it("DB-06: Customer with no transactions has balance 0 and status CLEAR", () => {
    const customer = createCustomer(50000);
    const balance = computeSqlBalancePaise(customer.transactions);
    expect(balance).toBe(0);
    expect(deriveStatus(balance, customer.alertStepPaise)).toBe("CLEAR");
    expect(paiseToString(balance)).toBe("0.00");
  });

  it("DB-07: Credit 500 then payment 200 gives balance 300", () => {
    const customer = createCustomer(50000);
    applyTransaction(customer, {
      id: "t1",
      type: "CREDIT",
      amountPaise: 50000,
      idempotencyKey: "k1",
    });
    applyTransaction(customer, {
      id: "t2",
      type: "PAYMENT",
      amountPaise: 20000,
      idempotencyKey: "k2",
    });

    const balance = computeSqlBalancePaise(customer.transactions);
    expect(balance).toBe(30000);
    expect(computeSumFormulaPaise(customer.transactions)).toBe(30000);
    expect(paiseToString(balance)).toBe("300.00");
    expect(deriveStatus(balance, customer.alertStepPaise)).toBe("OWING");
  });

  it("DB-08: Payment greater than balance requires confirmation and results in status ADVANCE", () => {
    const customer = createCustomer(50000);
    // Initial credit 100
    applyTransaction(customer, {
      id: "t1",
      type: "CREDIT",
      amountPaise: 10000,
      idempotencyKey: "k1",
    });

    // Payment 250 without confirmAdvance fails
    const unconfirmed = applyTransaction(customer, {
      id: "t2",
      type: "PAYMENT",
      amountPaise: 25000,
      idempotencyKey: "k2",
      confirmAdvance: false,
    });
    expect(unconfirmed.success).toBe(false);
    expect(unconfirmed.error).toBe("ADVANCE_CONFIRMATION_REQUIRED");
    expect(computeSqlBalancePaise(customer.transactions)).toBe(10000);

    // Payment 250 with confirmAdvance succeeds
    const confirmed = applyTransaction(customer, {
      id: "t3",
      type: "PAYMENT",
      amountPaise: 25000,
      idempotencyKey: "k3",
      confirmAdvance: true,
    });
    expect(confirmed.success).toBe(true);

    const balance = computeSqlBalancePaise(customer.transactions);
    expect(balance).toBe(-15000);
    expect(computeSumFormulaPaise(customer.transactions)).toBe(-15000);
    expect(paiseToString(balance)).toBe("-150.00");
    expect(deriveStatus(balance, customer.alertStepPaise)).toBe("ADVANCE");
  });

  it("DB-09: Idempotent replay on transaction creation does not duplicate entry or change balance", () => {
    const customer = createCustomer(50000);
    const r1 = applyTransaction(customer, {
      id: "t1",
      type: "CREDIT",
      amountPaise: 5000,
      idempotencyKey: "k-unique",
    });
    expect(r1.success).toBe(true);
    expect(r1.replayed).toBe(false);
    expect(customer.transactions.length).toBe(1);

    const r2 = applyTransaction(customer, {
      id: "t2-duplicate",
      type: "CREDIT",
      amountPaise: 5000,
      idempotencyKey: "k-unique",
    });
    expect(r2.success).toBe(true);
    expect(r2.replayed).toBe(true);
    expect(customer.transactions.length).toBe(1);
    expect(computeSqlBalancePaise(customer.transactions)).toBe(5000);
  });

  it("DB-11 & DB-12: Reversal restores prior balance; double reversal and reversal of reversal rejected", () => {
    const customer = createCustomer(50000);
    applyTransaction(customer, {
      id: "t1",
      type: "CREDIT",
      amountPaise: 5000,
      idempotencyKey: "k1",
    });
    expect(computeSqlBalancePaise(customer.transactions)).toBe(5000);

    // Reverse t1
    const rev1 = applyReversal(customer, {
      id: "rev-t1",
      targetTxnId: "t1",
      idempotencyKey: "k-rev1",
      reason: "Wrong entry",
    });
    expect(rev1.success).toBe(true);
    // Balance restored to 0
    expect(computeSqlBalancePaise(customer.transactions)).toBe(0);
    expect(computeSumFormulaPaise(customer.transactions)).toBe(0);
    expect(customer.reversedTxnIds.has("t1")).toBe(true);

    // Attempting to reverse t1 a second time
    const rev2 = applyReversal(customer, {
      id: "rev-t1-again",
      targetTxnId: "t1",
      idempotencyKey: "k-rev2",
      reason: "Accident again",
    });
    expect(rev2.success).toBe(false);
    expect(rev2.error).toBe("ALREADY_REVERSED");
    expect(computeSqlBalancePaise(customer.transactions)).toBe(0);

    // Attempting to reverse the reversal entry itself
    const revOfRev = applyReversal(customer, {
      id: "rev-of-rev",
      targetTxnId: "rev-t1",
      idempotencyKey: "k-rev3",
      reason: "Reversing reversal",
    });
    expect(revOfRev.success).toBe(false);
    expect(revOfRev.error).toBe("CANNOT_REVERSE_REVERSAL");
    expect(computeSqlBalancePaise(customer.transactions)).toBe(0);
  });

  it("DB-13: Reversal reason shorter than 3 characters is rejected", () => {
    const customer = createCustomer(50000);
    applyTransaction(customer, {
      id: "t1",
      type: "CREDIT",
      amountPaise: 5000,
      idempotencyKey: "k1",
    });

    const shortReason = applyReversal(customer, {
      id: "rev-short",
      targetTxnId: "t1",
      idempotencyKey: "k-short",
      reason: "no",
    });
    expect(shortReason.success).toBe(false);
    expect(shortReason.error).toBe("VALIDATION_FAILED");
    expect(computeSqlBalancePaise(customer.transactions)).toBe(5000);
  });

  it("M-PROP-01: Invariant holds across 150 randomized sequences of CREDIT, PAYMENT, and linked REVERSALs", () => {
    const ITERATIONS = 150;
    const alertStepPaise = 50000; // ₹500

    // Seeded deterministic PRNG for test reproducibility
    let seed = 42;
    function pseudoRandom(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    for (let seq = 0; seq < ITERATIONS; seq++) {
      const customer = createCustomer(alertStepPaise);
      const sequenceLength = Math.floor(pseudoRandom() * 40) + 10; // 10 to 50 operations

      let runningPaise = 0;

      for (let op = 0; op < sequenceLength; op++) {
        const choice = pseudoRandom();

        // 1. CREDIT operation (45% probability)
        if (choice < 0.45) {
          const amountPaise = Math.floor(pseudoRandom() * 50000) + 100; // ₹1 to ₹500
          const res = applyTransaction(customer, {
            id: `seq-${seq}-op-${op}`,
            type: "CREDIT",
            amountPaise,
            idempotencyKey: `idemp-seq-${seq}-op-${op}`,
          });
          expect(res.success).toBe(true);
          runningPaise += amountPaise;
        }
        // 2. PAYMENT operation (35% probability)
        else if (choice < 0.8) {
          const amountPaise = Math.floor(pseudoRandom() * 40000) + 100; // ₹1 to ₹400
          // If amount exceeds current running balance, pass confirmAdvance: true to simulate advance confirmation
          const confirmAdvance = amountPaise > runningPaise;
          const res = applyTransaction(customer, {
            id: `seq-${seq}-op-${op}`,
            type: "PAYMENT",
            amountPaise,
            idempotencyKey: `idemp-seq-${seq}-op-${op}`,
            confirmAdvance,
          });
          expect(res.success).toBe(true);
          runningPaise -= amountPaise;
        }
        // 3. REVERSAL operation (20% probability)
        else {
          // Find candidates: transactions that are not reversals and haven't been reversed
          const reversible = customer.transactions.filter(
            (t) => !t.isReversal && !customer.reversedTxnIds.has(t.id)
          );

          if (reversible.length > 0) {
            const targetIndex = Math.floor(pseudoRandom() * reversible.length);
            const target = reversible[targetIndex];

            const res = applyReversal(customer, {
              id: `seq-${seq}-rev-${op}`,
              targetTxnId: target.id,
              idempotencyKey: `idemp-seq-${seq}-rev-${op}`,
              reason: `Reversing op due to error ${op}`,
            });
            expect(res.success).toBe(true);

            // Reversal of CREDIT adds a PAYMENT (-amount)
            // Reversal of PAYMENT adds a CREDIT (+amount)
            if (target.type === "CREDIT") {
              runningPaise -= target.amountPaise;
            } else {
              runningPaise += target.amountPaise;
            }
          }
        }

        // --- INVARIANT CHECKS AT EVERY INTERMEDIATE STEP ---
        const sqlBalance = computeSqlBalancePaise(customer.transactions);
        const sumFormulaBalance = computeSumFormulaPaise(customer.transactions);

        // 1. SQL View balance === Sum Formula balance === Running balance
        expect(sqlBalance).toBe(runningPaise);
        expect(sumFormulaBalance).toBe(runningPaise);

        // 2. String conversion matches integer paise representation
        const balanceStr = paiseToString(sqlBalance);
        expect(moneyToPaise(balanceStr)).toBe(runningPaise);

        // 3. Status invariant
        const status = deriveStatus(sqlBalance, alertStepPaise);
        if (sqlBalance < 0) {
          expect(status).toBe("ADVANCE");
        } else if (sqlBalance === 0) {
          expect(status).toBe("CLEAR");
        } else if (sqlBalance >= alertStepPaise) {
          expect(status).toBe("ALERT");
        } else {
          expect(status).toBe("OWING");
        }
      }

      // Final assertion at end of sequence
      const finalSqlBalance = computeSqlBalancePaise(customer.transactions);
      const totalCreditPaise = customer.transactions
        .filter((t) => t.type === "CREDIT")
        .reduce((sum, t) => sum + t.amountPaise, 0);
      const totalPaymentPaise = customer.transactions
        .filter((t) => t.type === "PAYMENT")
        .reduce((sum, t) => sum + t.amountPaise, 0);

      expect(finalSqlBalance).toBe(totalCreditPaise - totalPaymentPaise);
    }
  });

  it("M-PROP-02: Total reversal sequence brings balance exactly back to 0", () => {
    const customer = createCustomer(50000);

    // Apply 20 mixed credits and payments
    const originalIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const type: TxnType = i % 3 === 0 ? "PAYMENT" : "CREDIT";
      const amountPaise = (i + 1) * 1500;
      const id = `orig-${i}`;
      applyTransaction(customer, {
        id,
        type,
        amountPaise,
        idempotencyKey: `key-orig-${i}`,
        confirmAdvance: true,
      });
      originalIds.push(id);
    }

    // Now reverse every single transaction in reverse chronological order
    for (const id of originalIds.reverse()) {
      const revRes = applyReversal(customer, {
        id: `rev-${id}`,
        targetTxnId: id,
        idempotencyKey: `key-rev-${id}`,
        reason: "Full ledger rewind",
      });
      expect(revRes.success).toBe(true);
    }

    // Balance MUST be exactly 0 paise
    const finalBalance = computeSqlBalancePaise(customer.transactions);
    expect(finalBalance).toBe(0);
    expect(paiseToString(finalBalance)).toBe("0.00");
    expect(deriveStatus(finalBalance, customer.alertStepPaise)).toBe("CLEAR");
  });
});
