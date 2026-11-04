import { test, expect } from "@playwright/test";

/**
 * E2E Customer Flows Suite: E2E-02, E2E-03, E2E-04
 * Spec reference: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 7.5, 7.6.3, 7.6.4, 7.8, 9.3 (E2E-02..E2E-04), 9.4
 *
 * Test cases:
 * - E2E-02: Add customer, appears in list, searchable by name and phone digits, empty search message.
 * - E2E-03: Duplicate phone warning appears; "Change number" keeps form; "Save anyway" creates second customer without merging.
 * - E2E-04: Customer deactivation and reactivation lifecycle (tabs, disabled udhaar, blocked status message).
 * - Validation: Invalid phone message and alert step 0 or negative rejected.
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

test.describe("Customer Flows Suite (E2E-02, E2E-03, E2E-04)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test.describe("E2E-02: Add customer and search", () => {
    test("E2E-02: creates customer, verifies in list, searches by name, phone digits, and verifies empty search", async ({
      page,
    }) => {
      // 1. Navigate to /customers/new
      await page.goto("/customers/new");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("heading", { name: "Add customer" })
      ).toBeVisible();

      // Form inputs
      const nameInput = page.getByLabel("Name");
      const phoneInput = page.getByLabel("Mobile number");
      const alertStepInput = page.getByLabel(/Alert step/i);
      const submitBtn = page.getByRole("button", { name: "Save customer" });

      // Fill valid customer details with unique phone
      const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
      const uniqueName = `Rohan Patel ${uniqueSuffix}`;
      const phone10 = `98${Date.now().toString().slice(-8)}`;

      await nameInput.fill(uniqueName);
      await phoneInput.fill(phone10);
      await alertStepInput.fill("500");

      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // After save: redirects to customer detail page /customers/[id]
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+$/, { timeout: 15000 });
      await expect(page.getByRole("heading", { name: uniqueName })).toBeVisible();

      // 2. Navigate to /customers list and verify customer is present
      await page.goto("/customers");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText(uniqueName)).toBeVisible();

      // 3. Search by customer name -> matches and displays
      const searchInput = page.getByLabel("Search customers");
      await searchInput.fill(uniqueName);
      // Wait for 200ms debounce
      await page.waitForTimeout(300);
      await expect(page.getByText(uniqueName)).toBeVisible();

      // 4. Search by 4-5 phone digits -> matches and displays
      const last4 = phone10.slice(-4);
      await searchInput.fill(last4);
      await page.waitForTimeout(300);
      await expect(page.getByText(uniqueName)).toBeVisible();

      // 5. Search with no match shows: "No customer matches \"<q>\"."
      const noMatchQuery = "NonExistentXYZ999";
      await searchInput.fill(noMatchQuery);
      await page.waitForTimeout(300);

      // Section 7.8 verbatim: "No customer matches \"<q>\"."
      const emptyStateMsg = page.getByText(`No customer matches "${noMatchQuery}".`);
      await expect(emptyStateMsg).toBeVisible();
    });
  });

  test.describe("E2E-03: Duplicate phone warning and Save anyway", () => {
    test("E2E-03: duplicate phone warns, 'Change number' keeps form data, 'Save anyway' saves without merging", async ({
      page,
    }) => {
      // We use Rahul Patel's phone: 919876543210 (10 digits: 9876543210)
      const existingPhone = "9876543210";
      const newCustomerName = `Karan Patel ${Date.now().toString().slice(-4)}`;

      // 1. Navigate to /customers/new
      await page.goto("/customers/new");
      await page.waitForLoadState("domcontentloaded");

      const nameInput = page.getByLabel("Name");
      const phoneInput = page.getByLabel("Mobile number");
      const submitBtn = page.getByRole("button", { name: "Save customer" });

      await nameInput.fill(newCustomerName);
      await phoneInput.fill(existingPhone);
      await submitBtn.click();

      // 2. ConfirmSheet appears with duplicate warning
      // Section 7.6.4: ConfirmSheet "This number is already saved for Amit Shah." / Rahul Patel
      const warningSheet = page.locator('[role="dialog"]');
      await expect(warningSheet).toBeVisible();
      await expect(warningSheet).toContainText("This number is already saved");

      // Verify buttons in ConfirmSheet
      const changeNumberBtn = page.getByRole("button", { name: "Change number" });
      const saveAnywayBtn = page.getByRole("button", { name: "Save anyway" });
      await expect(changeNumberBtn).toBeVisible();
      await expect(saveAnywayBtn).toBeVisible();

      // 3. Click "Change number": dismisses sheet and retains form data
      await changeNumberBtn.click();
      await expect(warningSheet).not.toBeVisible();
      await expect(nameInput).toHaveValue(newCustomerName);
      await expect(phoneInput).toHaveValue(existingPhone);

      // 4. Click "Save customer" again and click "Save anyway"
      await submitBtn.click();
      await expect(warningSheet).toBeVisible();
      await saveAnywayBtn.click();

      // Successfully creates second customer and redirects to detail page
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+$/, { timeout: 15000 });
      await expect(page.getByRole("heading", { name: newCustomerName })).toBeVisible();

      // 5. Verify both customers exist independently and are never merged (D-09)
      await page.goto("/customers?q=9876543210");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText(newCustomerName)).toBeVisible();
      await expect(page.getByText("Rahul Patel")).toBeVisible();
    });
  });

  test.describe("E2E-04: Customer deactivation and reactivation lifecycle", () => {
    test("E2E-04: deactivate customer hides from Active, shows under Inactive, blocks udhaar, reactivation re-enables", async ({
      page,
    }) => {
      // 1. Navigate to /customers and find active customer 'Jay Mehta'
      await page.goto("/customers");
      await page.waitForLoadState("domcontentloaded");

      const customerLink = page.getByRole("link", { name: /Jay Mehta/ });
      await expect(customerLink).toBeVisible();
      await customerLink.click();

      // 2. On detail page: verify active state and enabled "Add udhaar"
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+$/);
      const addUdhaarBtn = page.locator("main").getByRole("link", { name: "Add udhaar" });
      await expect(addUdhaarBtn).toBeVisible();
      await expect(page.getByText("Inactive. New udhaar is blocked.")).not.toBeVisible();

      // 3. Edit -> Deactivate
      const editLink = page.getByRole("link", { name: "Edit", exact: true });
      await editLink.click();
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+\/edit$/);

      const deactivateBtn = page.getByRole("button", {
        name: "Deactivate customer",
      });
      await expect(deactivateBtn).toBeVisible();
      await deactivateBtn.click();

      // 4. Returned to detail page: displays "Inactive. New udhaar is blocked." and "Add udhaar" is disabled
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+$/);
      await expect(
        page.getByText("Inactive. New udhaar is blocked.")
      ).toBeVisible();

      // "Add udhaar" button should now be disabled (disabled button, not link)
      const disabledUdhaarBtn = page.locator("main").getByRole("button", { name: "Add udhaar" });
      await expect(disabledUdhaarBtn).toBeDisabled();

      // 5. Navigate to /customers: customer disappears from "Active" tab and appears under "Inactive" tab
      await page.goto("/customers?status=active");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("main").getByText("Jay Mehta")).not.toBeVisible();

      await page.goto("/customers?status=inactive");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("main").getByText("Jay Mehta")).toBeVisible();

      // 6. Reactivate customer -> status returns to active, "Add udhaar" re-enabled
      await page.locator("main").getByRole("link", { name: /Jay Mehta/ }).click();
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+$/);

      await page.getByRole("link", { name: "Edit", exact: true }).click();
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+\/edit$/);

      const reactivateBtn = page.getByRole("button", {
        name: "Reactivate customer",
      });
      await expect(reactivateBtn).toBeVisible();
      await reactivateBtn.click();

      // Returned to detail page: active again
      await page.waitForURL(/\/customers\/[0-9a-fA-F-]+$/);
      await expect(
        page.getByText("Inactive. New udhaar is blocked.")
      ).not.toBeVisible();

      const reenabledUdhaarBtn = page.locator("main").getByRole("link", { name: "Add udhaar" });
      await expect(reenabledUdhaarBtn).toBeVisible();
    });
  });

  test.describe("Validation rules", () => {
    test("validation: invalid phone displays specified copy", async ({
      page,
    }) => {
      await page.goto("/customers/new");
      await page.waitForLoadState("domcontentloaded");

      const nameInput = page.getByLabel("Name");
      const phoneInput = page.getByLabel("Mobile number");
      const submitBtn = page.getByRole("button", { name: "Save customer" });

      await nameInput.fill("Invalid Phone User");

      // Test 9 digits (invalid)
      await phoneInput.fill("987654321");
      await submitBtn.click();

      // Spec 7.8: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
      await expect(
        page.getByText(
          "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
        )
      ).toBeVisible();

      // Test number starting with 5 (invalid)
      await phoneInput.fill("5876543210");
      await submitBtn.click();

      await expect(
        page.getByText(
          "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
        )
      ).toBeVisible();
    });

    test("validation: alert step 0 or negative is rejected", async ({ page }) => {
      await page.goto("/customers/new");
      await page.waitForLoadState("domcontentloaded");

      const nameInput = page.getByLabel("Name");
      const phoneInput = page.getByLabel("Mobile number");
      const alertStepInput = page.getByLabel(/Alert step/i);
      const submitBtn = page.getByRole("button", { name: "Save customer" });

      await nameInput.fill("Invalid Step User");
      await phoneInput.fill("9876543219");

      // Alert step 0
      await alertStepInput.fill("0");
      await submitBtn.click();

      // Must be rejected with amount error
      await expect(
        page.getByText("Amount must be between ₹0.01 and ₹1,00,000.")
      ).toBeVisible();

      // Alert step negative
      await alertStepInput.fill("-50");
      await submitBtn.click();

      await expect(
        page.getByText("Amount must be between ₹0.01 and ₹1,00,000.")
      ).toBeVisible();
    });
  });
});
