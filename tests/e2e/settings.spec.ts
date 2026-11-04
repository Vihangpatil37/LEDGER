import { test, expect } from "@playwright/test";

/**
 * E2E Settings & Live Template Preview Flows Suite: E2E-13, E2E-14
 * Spec reference: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 7.5, 7.6.4, 8 Phase 4, 9.3 (E2E-13, E2E-14)
 *
 * Test cases:
 * - E2E-13: Settings view & live template preview:
 *   - Changing shop name or template updates live sample preview box in real time.
 *   - Removing {name} displays validation error and disables Save button.
 *   - Removing {amount} displays validation error and disables Save button.
 * - E2E-14: Settings persistence:
 *   - Updates shop name and alert step -> saves -> reloads -> verifies values persisted.
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

test.describe("Settings Flows Suite (E2E-13, E2E-14)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test.describe("E2E-13: Settings View & Live Template Preview", () => {
    test("E2E-13: live preview updates in real time and template validation blocks invalid placeholders", async ({
      page,
    }) => {
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("heading", { name: "Settings" })
      ).toBeVisible();

      const shopNameInput = page.locator("#shop-name");
      const templateTextarea = page.locator("#reminder-template");
      const saveBtn = page.getByRole("button", { name: "Save settings" });

      // Verify live sample preview box exists
      await expect(page.getByText(/Live sample preview/i)).toBeVisible();
      const previewBox = page.locator(".whitespace-pre-wrap");
      await expect(previewBox).toBeVisible();

      // 1. Updating shop name updates preview in real time (when {shop} is in template)
      const testTemplateWithShop =
        "Namaste {name} ji! Aapka ₹{amount} pending hai at {shop}. Dhanyavaad!";
      await templateTextarea.fill(testTemplateWithShop);

      const uniqueShop = `Chai Point ${Date.now().toString().slice(-4)}`;
      await shopNameInput.fill(uniqueShop);

      await expect(previewBox).toContainText(uniqueShop);
      await expect(previewBox).toContainText("Rahul Patel");
      await expect(previewBox).toContainText("₹500");

      // 2. Removing {name} shows validation error and disables Save button
      const templateMissingName = "Aapka ₹{amount} pending hai.";
      await templateTextarea.fill(templateMissingName);

      await expect(
        page.getByText(/must include the {name} placeholder/i)
      ).toBeVisible();
      await expect(saveBtn).toBeDisabled();

      // 3. Removing {amount} shows validation error and disables Save button
      const templateMissingAmount = "Namaste {name} ji! Pending payment clear kar dein.";
      await templateTextarea.fill(templateMissingAmount);

      await expect(
        page.getByText(/must include the {amount} placeholder/i)
      ).toBeVisible();
      await expect(saveBtn).toBeDisabled();

      // 4. Restoring valid template clears error and re-enables Save button
      const validTemplate =
        "Namaste {name} ji! ₹{amount} udhaar pending hai. Kripya clear karein.";
      await templateTextarea.fill(validTemplate);

      await expect(
        page.getByText(/must include the.*placeholder/i)
      ).not.toBeVisible();
      await expect(saveBtn).toBeEnabled();
    });
  });

  test.describe("E2E-14: Settings Persistence", () => {
    test("E2E-14: updates stall details and default alert step, saves, reloads and verifies persistence", async ({
      page,
    }) => {
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      const shopNameInput = page.locator("#shop-name");
      const ownerNameInput = page.locator("#owner-name");
      const alertStepInput = page.locator("#default-alert-step");
      const templateTextarea = page.locator("#reminder-template");
      const saveBtn = page.getByRole("button", { name: "Save settings" });

      const uniqueShop = "Gupta Chai Corner";
      const uniqueOwner = "Manoj Gupta";
      const customAlertStep = "750";
      const persistentTemplate =
        "Namaste {name} ji! 🙏 Aapka ₹{amount} udhaar baaki hai. - {shop}";

      await shopNameInput.fill(uniqueShop);
      await ownerNameInput.fill(uniqueOwner);
      await alertStepInput.fill(customAlertStep);
      await templateTextarea.fill(persistentTemplate);

      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      // Verify success status banner
      const statusBanner = page.locator('div[role="status"]').filter({ hasText: "Settings saved." });
      await expect(statusBanner).toBeVisible();

      // Reload page to test database/mock persistence
      await page.reload();
      await page.waitForLoadState("domcontentloaded");

      // Verify all updated values persisted
      await expect(shopNameInput).toHaveValue(uniqueShop);
      await expect(ownerNameInput).toHaveValue(uniqueOwner);
      await expect(alertStepInput).toHaveValue(customAlertStep);
      await expect(templateTextarea).toHaveValue(persistentTemplate);
    });
  });
});
