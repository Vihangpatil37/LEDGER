import { describe, it, expect } from "vitest";

/**
 * Pure alert calculation logic matching PostgreSQL RPC create_transaction:
 *
 * level_before = case when v_before > 0 then floor(v_before / alert_step) else 0 end
 * level_after  = case when v_after > 0  then floor(v_after / alert_step) else 0 end
 * if level_after > level_before:
 *   alert = { level: level_after, crossed_amount: (level_after * alert_step)::text }
 * else:
 *   alert = null
 *
 * All arithmetic in integer paise.
 */
export interface AlertCalculationResult {
  level: number;
  crossedAmount: string;
}

export function computeAlert(
  balanceBeforePaise: number,
  balanceAfterPaise: number,
  alertStepPaise: number,
  type: "CREDIT" | "PAYMENT"
): AlertCalculationResult | null {
  // D-05: Payments and reversals never produce alerts
  if (type !== "CREDIT") {
    return null;
  }
  if (alertStepPaise <= 0) {
    return null;
  }

  const levelBefore =
    balanceBeforePaise > 0
      ? Math.floor(balanceBeforePaise / alertStepPaise)
      : 0;
  const levelAfter =
    balanceAfterPaise > 0
      ? Math.floor(balanceAfterPaise / alertStepPaise)
      : 0;

  if (levelAfter > levelBefore) {
    const crossedPaise = levelAfter * alertStepPaise;
    return {
      level: levelAfter,
      crossedAmount: (crossedPaise / 100).toFixed(2),
    };
  }

  return null;
}

describe("Alert Matrix Unit Tests (AL-01 to AL-08 per Section 9.2 & Phase 4)", () => {
  const step500Paise = 50000; // ₹500 in paise

  it("AL-01: step 500, balance 0 -> 250 (level 0, crossed null)", () => {
    const alert = computeAlert(0, 25000, step500Paise, "CREDIT");
    expect(alert).toBeNull();
  });

  it("AL-01 (spec): step 500, balance 0 -> 400 gives no alert", () => {
    const alert = computeAlert(0, 40000, step500Paise, "CREDIT");
    expect(alert).toBeNull();
  });

  it("AL-02: step 500, balance 250 -> 500 (level 1, crossed 500)", () => {
    const alert = computeAlert(25000, 50000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 1,
      crossedAmount: "500.00",
    });
  });

  it("AL-02 (spec): step 500, balance 400 -> 500 gives alert level 1, crossed amount 500", () => {
    const alert = computeAlert(40000, 50000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 1,
      crossedAmount: "500.00",
    });
  });

  it("AL-03: step 500, balance 500 -> 750 (level 1, crossed null)", () => {
    const alert = computeAlert(50000, 75000, step500Paise, "CREDIT");
    expect(alert).toBeNull();
  });

  it("AL-03 (spec): step 500, balance 500 -> 900 gives no alert", () => {
    const alert = computeAlert(50000, 90000, step500Paise, "CREDIT");
    expect(alert).toBeNull();
  });

  it("AL-04: step 500, balance 750 -> 1200 (level 2, crossed 1000)", () => {
    const alert = computeAlert(75000, 120000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 2,
      crossedAmount: "1000.00",
    });
  });

  it("AL-04 (spec): step 500, balance 900 -> 1100 gives alert level 2, crossed amount 1000", () => {
    const alert = computeAlert(90000, 110000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 2,
      crossedAmount: "1000.00",
    });
  });

  it("AL-05: step 500, balance 1200 -> 900 (level 1, crossed null - payment never raises alert)", () => {
    const alert = computeAlert(120000, 90000, step500Paise, "PAYMENT");
    expect(alert).toBeNull();
  });

  it("AL-05 (spec): One credit jumping 0 to 1600 gives alert level 3, crossed amount 1500 (single alert)", () => {
    const alert = computeAlert(0, 160000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 3,
      crossedAmount: "1500.00",
    });
  });

  it("AL-06: step 500, balance 900 -> 1050 (level 2, crossed 1000 - re-crossing after drop)", () => {
    const alert = computeAlert(90000, 105000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 2,
      crossedAmount: "1000.00",
    });
  });

  it("AL-06 (spec): 1100 down to 400 by payment, then up to 600 by credit gives alert level 1 again", () => {
    // 1. Payment down to 400 -> no alert
    const paymentAlert = computeAlert(110000, 40000, step500Paise, "PAYMENT");
    expect(paymentAlert).toBeNull();

    // 2. Credit from 400 to 600 -> crosses 500 -> alert level 1
    const creditAlert = computeAlert(40000, 60000, step500Paise, "CREDIT");
    expect(creditAlert).toEqual({
      level: 1,
      crossedAmount: "500.00",
    });
  });

  it("AL-07: step 500, balance -200 -> 600 (level 1, crossed 500 - cross from advance)", () => {
    const alert = computeAlert(-20000, 60000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 1,
      crossedAmount: "500.00",
    });
  });

  it("AL-07 (spec): Payments and reversals never produce an alert", () => {
    // Payment crossing from positive to negative (advance)
    expect(computeAlert(50000, -10000, step500Paise, "PAYMENT")).toBeNull();
    // Payment within owing
    expect(computeAlert(100000, 50000, step500Paise, "PAYMENT")).toBeNull();
  });

  it("AL-08: step 500, balance 250 -> 2000 (level 4, crossed 2000 - multi-step jump)", () => {
    const alert = computeAlert(25000, 200000, step500Paise, "CREDIT");
    expect(alert).toEqual({
      level: 4,
      crossedAmount: "2000.00",
    });
  });

  it("AL-08 (spec): Custom alert step (e.g. 1000) calculates multiples of new step", () => {
    const step1000Paise = 100000;
    // 500 to 950 gives no alert on step 1000
    expect(computeAlert(50000, 95000, step1000Paise, "CREDIT")).toBeNull();
    // 950 to 1050 crosses 1000
    expect(computeAlert(95000, 105000, step1000Paise, "CREDIT")).toEqual({
      level: 1,
      crossedAmount: "1000.00",
    });
    // 1050 to 2200 crosses 2000
    expect(computeAlert(105000, 220000, step1000Paise, "CREDIT")).toEqual({
      level: 2,
      crossedAmount: "2000.00",
    });
  });
});
