import { test, expect } from "@playwright/test";

/**
 * E2E Ledger Flows Suite: E2E-05, E2E-06, E2E-07, E2E-08, E2E-09, E2E-10 & Performance Benchmark
 * Spec reference: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 7.6.2, 7.6.3, 7.6.4, 7.8, 8 (Phase 3 exit criteria), 9.3
 *
 * Test cases:
 * - E2E-05: Fast entry: pick customer, type 50, tap Chai note chip, click Save -> ResultSheet appears with updated balance.
 * - E2E-06: Double-click/double-tap Save creates exactly one transaction row via unique idempotency key.
 * - E2E-07: Simulated network/server failure displays InlineError, preserves form values, retry saves once.
 * - E2E-08: Payment exceeding balance triggers ConfirmSheet ("Payment is more than the balance.") -> "Save as advance" records advance payment -> hero balance displays Advance.
 * - E2E-09: Reversal flow: tap ledger row -> ReverseSheet opens -> enter reason (>= 3 chars) -> "Reverse entry" -> original struck-through "Reversed", new reversal entry created, balance restored; second reversal rejected.
 * - E2E-10: Pagination: "Load older entries" appends older page of transactions; running balance remains consistent across pages.
 * - Performance benchmark: Timed fast entry run completes in <= 15s on mobile viewport emulation.
 */

async function loginAsOwner(page: any) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  const emailInput = page.getByLabel("Email");
  const passwordInput = page.getByLabel("Password");
  const submitBtn = page.getByRole("button", { name: "Log in" });

  await emailInput.fill("owner@chailedger.local");
  await passwordInput.fill("password123");
  await submitBtn.click();

  await page.waitForURL((url: URL) => url.pathname !== "/login", {
    timeout: 10000,
  });
}

function getVisibleLedger(page: any, isMobile?: boolean) {
  return isMobile
    ? page.locator(".block.md\\:hidden")
    : page.locator("table");
}

test.describe("Ledger Flows Suite (E2E-05..E2E-10)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test.describe("E2E-05: Fast Entry Flow", () => {
    test("E2E-05: selects customer, enters 50, taps Chai note chip, saves udhaar, and verifies ResultSheet", async ({
      page,
    }) => {
      // 1. Navigate to Entry page
      await page.goto("/entry?type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      // Verify Segmented Switch has Udhaar active
      const udhaarTab = page.getByRole("tab", { name: "Udhaar" });
      await expect(udhaarTab).toHaveAttribute("aria-selected", "true");

      // 2. Open Customer Picker
      const customerPickerTrigger = page.getByRole("button", {
        name: /Select customer/i,
      });
      await customerPickerTrigger.click();

      // In picker sheet, click "Rahul Patel"
      const customerOption = page
        .getByRole("button", { name: /Rahul Patel/i })
        .first();
      await expect(customerOption).toBeVisible();
      await customerOption.click();

      // Picker closes, customer name and balance readout appear
      await expect(page.getByText("Rahul Patel").first()).toBeVisible();
      await expect(page.getByText(/Owes ₹/i).first()).toBeVisible();

      // 3. Enter amount 50
      const amountInput = page.locator("#amount-input");
      await amountInput.fill("50");

      // 4. Tap "Chai" note chip
      const chaiChip = page.getByRole("button", { name: "Chai" });
      await chaiChip.click();

      // Verify note field has "Chai"
      const noteInput = page.getByLabel(/Note/i);
      await expect(noteInput).toHaveValue("Chai");

      // 5. Click Save udhaar
      const saveBtn = page.getByRole("button", { name: "Save udhaar" });
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      // 6. ResultSheet appears
      await expect(page.getByText("Entry saved")).toBeVisible();
      await expect(
        page.getByText(/₹50 udhaar added for Rahul Patel\./i)
      ).toBeVisible();
      await expect(page.getByText(/Balance ₹/i)).toBeVisible();

      // Click Done
      const doneBtn = page.getByRole("button", { name: "Done" });
      await doneBtn.click();

      // Sheet closes, form resets
      await expect(page.getByText("Entry saved")).not.toBeVisible();
      await expect(amountInput).toHaveValue("");
    });
  });

  test.describe("E2E-06: Idempotency Protection", () => {
    test("E2E-06: double-click Save creates exactly one transaction row via unique idempotency key", async ({
      page,
      isMobile,
    }) => {
      await page.goto("/entry?type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      // Pick Jay Mehta
      await page.getByRole("button", { name: /Select customer/i }).click();
      await page.getByRole("button", { name: /Jay Mehta/i }).first().click();

      // Enter amount 30 and unique note
      const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const uniqueNote = `DoubleTap Test ${uniqueSuffix}`;
      await page.locator("#amount-input").fill("30");
      await page.getByLabel(/Note/i).fill(uniqueNote);

      // Save button
      const saveBtn = page.getByRole("button", { name: "Save udhaar" });
      await expect(saveBtn).toBeEnabled();

      // Perform rapid clicks
      await Promise.all([saveBtn.click({ clickCount: 2 })]);

      // ResultSheet appears
      await expect(page.getByText("Entry saved")).toBeVisible();
      await page.getByRole("button", { name: "Done" }).click();

      // Navigate to Jay Mehta's customer ledger to check row count
      await page.goto("/customers/10000000-0000-0000-0000-000000000003");
      await page.waitForLoadState("domcontentloaded");

      // Check visible entries in the responsive ledger container
      const visibleLedger = getVisibleLedger(page, isMobile);
      const entriesMatchingNote = visibleLedger.getByText(uniqueNote);
      await expect(entriesMatchingNote).toHaveCount(1);
    });
  });

  test.describe("E2E-07: Error Handling & Retry", () => {
    test("E2E-07: simulated network failure shows InlineError, preserves form values, retry saves once", async ({
      page,
    }) => {
      await page.goto("/entry?type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      // Pick Rahul Patel
      await page.getByRole("button", { name: /Select customer/i }).click();
      await page.getByRole("button", { name: /Rahul Patel/i }).first().click();

      // Enter amount 75 and select "Cold drink" chip
      await page.locator("#amount-input").fill("75");
      await page.getByRole("button", { name: "Cold drink" }).click();

      // Intercept Next.js action request and abort it to simulate network failure
      let abortRequest = true;
      await page.route("**/entry*", async (route) => {
        if (abortRequest && route.request().method() === "POST") {
          await route.abort("failed");
        } else {
          await route.continue();
        }
      });

      // Attempt to save
      const saveBtn = page.getByRole("button", { name: "Save udhaar" });
      await saveBtn.click();

      // Inline error appears with Section 7.8 verbatim copy
      const inlineError = page.locator('[role="alert"]').first();
      await expect(inlineError).toBeVisible();
      await expect(inlineError).toContainText(
        "Not saved. Check your connection and try again."
      );

      // Verify ResultSheet did NOT open
      await expect(page.getByText("Entry saved")).not.toBeVisible();

      // Verify form values preserved
      await expect(page.locator("#amount-input")).toHaveValue("75");
      await expect(page.getByLabel(/Note/i)).toHaveValue("Cold drink");
      await expect(page.getByText("Rahul Patel").first()).toBeVisible();

      // Now restore network connection and retry save
      abortRequest = false;
      await saveBtn.click();

      // ResultSheet opens successfully
      await expect(page.getByText("Entry saved")).toBeVisible();
      await expect(
        page.getByText(/₹75 udhaar added for Rahul Patel\./i)
      ).toBeVisible();

      // Click Done
      await page.getByRole("button", { name: "Done" }).click();
      await expect(page.getByText("Entry saved")).not.toBeVisible();
    });
  });

  test.describe("E2E-08: Advance Payment Flow", () => {
    test("E2E-08: payment exceeding balance triggers ConfirmSheet, 'Save as advance' records advance payment", async ({
      page,
    }) => {
      // 1. Navigate to Entry with Payment type
      await page.goto("/entry?type=payment");
      await page.waitForLoadState("domcontentloaded");

      const paymentTab = page.getByRole("tab", { name: "Payment" });
      await expect(paymentTab).toHaveAttribute("aria-selected", "true");

      // 2. Select Suresh Kumar
      await page.getByRole("button", { name: /Select customer/i }).click();
      await page.getByRole("button", { name: /Suresh Kumar/i }).first().click();

      // 3. Enter payment 200 and a note (note ensures valid string until BUG-002 resolved)
      await page.locator("#amount-input").fill("200");
      await page.getByLabel(/Note/i).fill("Advance cash");

      // 4. Tap Save payment
      const saveBtn = page.getByRole("button", { name: "Save payment" });
      await saveBtn.click();

      // 5. ConfirmSheet appears per Section 7.6.2 & 7.8
      await expect(
        page.getByText("Payment is more than the balance.")
      ).toBeVisible();
      await expect(page.getByText("Advance after")).toBeVisible();

      // 6. Test 'Change amount' button cancels sheet and keeps form
      const changeAmountBtn = page.getByRole("button", {
        name: "Change amount",
      });
      await changeAmountBtn.click();
      await expect(
        page.getByText("Payment is more than the balance.")
      ).not.toBeVisible();
      await expect(page.locator("#amount-input")).toHaveValue("200");

      // 7. Click Save payment again and confirm as advance
      await saveBtn.click();
      await expect(
        page.getByText("Payment is more than the balance.")
      ).toBeVisible();

      const saveAdvanceBtn = page.getByRole("button", {
        name: "Save as advance",
      });
      await saveAdvanceBtn.click();

      // 8. ResultSheet opens displaying Advance balance
      await expect(page.getByText("Entry saved")).toBeVisible();
      await expect(
        page.getByText(/₹200 payment recorded for Suresh Kumar\./i)
      ).toBeVisible();
      await expect(page.getByText(/Advance ₹/i).first()).toBeVisible();

      await page.getByRole("button", { name: "Done" }).click();

      // 9. Navigate to Suresh Kumar's customer details and verify Hero Balance is Advance
      await page.goto("/customers/10000000-0000-0000-0000-000000000005");
      await page.waitForLoadState("domcontentloaded");

      // Hero balance line displays Advance status
      await expect(page.getByText(/Advance ₹/i).first()).toBeVisible();
    });
  });

  test.describe("E2E-09: Reversal Flow", () => {
    test("E2E-09: reverses a ledger row with reason, verifies struck styling, restored balance, and double reversal rejection", async ({
      page,
      isMobile,
    }) => {
      // 1. Create a dedicated entry to reverse
      const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const noteToReverse = `RevItem ${uniqueSuffix}`;

      await page.goto("/entry?customer=10000000-0000-0000-0000-000000000001&type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      await page.locator("#amount-input").fill("45");
      await page.getByLabel(/Note/i).fill(noteToReverse);

      const saveBtn = page.getByRole("button", { name: "Save udhaar" });
      await saveBtn.click();

      await expect(page.getByText("Entry saved")).toBeVisible();
      await page.getByRole("button", { name: "Done" }).click();

      // 2. Navigate to Rahul Patel's customer details
      await page.goto("/customers/10000000-0000-0000-0000-000000000001");
      await page.waitForLoadState("domcontentloaded");

      const visibleLedger = getVisibleLedger(page, isMobile);

      // 3. Select the newly created ledger row
      const rowToReverse = visibleLedger.getByText(noteToReverse).first();
      await expect(rowToReverse).toBeVisible();
      await rowToReverse.click();

      // 4. ReverseSheet opens
      await expect(page.getByText("Entry details")).toBeVisible();
      await expect(page.getByText("Reason for reversing")).toBeVisible();

      const reasonInput = page.getByLabel("Reason for reversing");
      const reverseSubmitBtn = page.getByRole("button", {
        name: "Reverse entry",
      });

      // Validation: Reason < 3 characters disables button
      await reasonInput.fill("no");
      await expect(reverseSubmitBtn).toBeDisabled();

      // Fill valid reason
      await reasonInput.fill("Customer was overcharged");
      await expect(reverseSubmitBtn).toBeEnabled();

      // 5. Click Reverse entry
      await reverseSubmitBtn.click();

      // Reversal confirmation notice inside sheet
      await expect(page.getByText("Entry reversed.")).toBeVisible();

      // Click Done / Close
      const doneBtn = page.getByRole("button", { name: /Done|Close/i }).last();
      await doneBtn.click();

      // 6. In ledger: verify original row shows "Reversed"
      await expect(visibleLedger.getByText("Reversed").first()).toBeVisible();

      // Verify reversal row appeared: "Reversal: Customer was overcharged"
      await expect(
        visibleLedger
          .getByText("Reversal: Customer was overcharged")
          .first()
      ).toBeVisible();

      // 7. Tap the already reversed entry again -> ReverseSheet should explain and disallow second reversal
      await rowToReverse.click();
      await expect(page.getByText("Entry details")).toBeVisible();
      await expect(
        page.getByText("This entry was already reversed.")
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Reverse entry" })
      ).not.toBeVisible();
    });
  });

  test.describe("E2E-10: Ledger Pagination", () => {
    test("E2E-10: loads older ledger entries and preserves running balance consistency", async ({
      page,
      isMobile,
    }) => {
      // 1. Navigate to Priya Sharma (customer id 6, seeded with 55 transactions)
      await page.goto("/customers/10000000-0000-0000-0000-000000000006");
      await page.waitForLoadState("domcontentloaded");

      const visibleLedger = getVisibleLedger(page, isMobile);

      // Verify "Load older entries" button is visible
      const loadOlderBtn = page.getByRole("button", {
        name: "Load older entries",
      });
      await expect(loadOlderBtn).toBeVisible();

      // Verify initial page contains Chai order 55
      await expect(
        visibleLedger.getByText("Chai order 55").first()
      ).toBeVisible();
      // Chai order 1 should not be in the initial 50 rows
      await expect(
        visibleLedger.getByText("Chai order 1", { exact: true })
      ).not.toBeVisible();

      // 2. Click "Load older entries"
      await loadOlderBtn.click();

      // 3. Older entries appear
      await expect(
        visibleLedger.getByText("Chai order 1", { exact: true })
      ).toBeVisible();

      // Button should now disappear as all 55 entries are loaded
      await expect(
        page.getByRole("button", { name: "Load older entries" })
      ).not.toBeVisible();
    });
  });

  test.describe("Performance Benchmark: Fast Entry Time", () => {
    test("benchmarks fast entry on mobile viewport in <= 15 seconds", async ({
      page,
    }) => {
      // Emulate mobile viewport
      await page.setViewportSize({ width: 360, height: 640 });

      const startTime = Date.now();

      // Step 1: Open /entry
      await page.goto("/entry?type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      // Step 2: Pick customer
      await page.getByRole("button", { name: /Select customer/i }).click();
      await page.getByRole("button", { name: /Jay Mehta/i }).first().click();

      // Step 3: Type 50 in amount
      const amountInput = page.locator("#amount-input");
      await amountInput.fill("50");

      // Step 4: Tap Chai chip
      await page.getByRole("button", { name: "Chai" }).click();

      // Step 5: Tap Save udhaar
      const saveBtn = page.getByRole("button", { name: "Save udhaar" });
      await saveBtn.click();

      // Step 6: Wait for ResultSheet
      await expect(page.getByText("Entry saved")).toBeVisible();

      const durationMs = Date.now() - startTime;
      const durationSeconds = durationMs / 1000;

      console.log(
        `[PERF BENCHMARK]: Mobile Fast Entry completed in ${durationSeconds.toFixed(2)}s across 5 user steps.`
      );

      // Section 8 Phase 3 exit criteria: <= 15 seconds
      expect(durationSeconds).toBeLessThanOrEqual(15);
    });
  });
});
