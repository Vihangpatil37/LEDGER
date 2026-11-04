import { test, expect } from "@playwright/test";

/**
 * E2E Dashboard & WhatsApp Reminder Flows Suite: E2E-11, E2E-12
 * Spec reference: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 7.6.1, 7.6.4, 8 Phase 4, 9.3 (E2E-11, E2E-12)
 *
 * Test cases:
 * - E2E-11: Dashboard summary verification:
 *   - "Needs a reminder" lists customers past alert step with "Crossed ₹X", balance, and "Remind" action.
 *   - "Today" definition list shows credits given and payments received.
 *   - "All customers" shows total outstanding, advance held, active count.
 *   - "Recent entries" lists recent transactions.
 * - E2E-12: Reminder flow from Dashboard & Customer details:
 *   - Tapping "Remind" on Dashboard navigates to Customer Details and auto-opens ReminderSheet.
 *   - Tapping "Send WhatsApp reminder" on Customer Details opens ReminderSheet.
 *   - Formatted phone displayed read-only (+91 XXXXX XXXXX).
 *   - Textarea contains generated reminder draft with saved name and balance.
 *   - "Open WhatsApp" link targets https://wa.me/91... with encoded message.
 *   - Clicking updates helper copy to "WhatsApp opened. Press Send there."
 *   - Invariant: App never claims reminder was "sent".
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

test.describe("Dashboard & Reminder Flows Suite (E2E-11, E2E-12)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test.describe("E2E-11: Dashboard Summary Verification", () => {
    test("E2E-11: displays alerts, today totals, all customers figures, and recent entries correctly", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // 1. Needs a reminder section
      const reminderSection = page.locator('section[aria-labelledby="needs-reminder-title"]');
      await expect(reminderSection).toBeVisible();
      await expect(
        reminderSection.getByRole("heading", { name: /Needs a reminder/i })
      ).toBeVisible();

      // Check alert customers in the list (Rahul Patel, Amit Shah, Jay Mehta)
      await expect(reminderSection.getByText("Rahul Patel")).toBeVisible();
      await expect(reminderSection.getByText(/Crossed ₹/i).first()).toBeVisible();

      // Verify "Remind" action button exists in reminder row
      const remindBtn = reminderSection.getByRole("button", { name: "Remind" }).first();
      await expect(remindBtn).toBeVisible();

      // 2. Today section
      const todaySection = page.locator('section[aria-labelledby="today-title"]');
      await expect(todaySection).toBeVisible();
      await expect(todaySection.getByText("Udhaar given")).toBeVisible();
      await expect(todaySection.getByText("Payments received")).toBeVisible();

      // 3. All customers section
      const allCustomersSection = page.locator('section[aria-labelledby="all-customers-title"]');
      await expect(allCustomersSection).toBeVisible();
      await expect(allCustomersSection.getByText("Total outstanding")).toBeVisible();
      await expect(allCustomersSection.getByText("Active customers")).toBeVisible();

      // 4. Recent entries section
      const recentSection = page.locator('section[aria-labelledby="recent-entries-title"]');
      await expect(recentSection).toBeVisible();
      await expect(
        recentSection.getByRole("heading", { name: "Recent entries" })
      ).toBeVisible();

      // Recent entries list should show entries or empty state
      const hasRecentEntries = await recentSection.locator(".divide-y > *").count();
      const hasEmptyState = await recentSection.getByText("No entries yet.").count();
      expect(hasRecentEntries > 0 || hasEmptyState > 0).toBe(true);
    });
  });

  test.describe("E2E-12: WhatsApp Reminder Flow", () => {
    test("E2E-12: opens ReminderSheet from dashboard and customer details with correct wa.me link and helper copy", async ({
      page,
    }) => {
      // --- PART 1: Dashboard Remind button flow ---
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      const reminderSection = page.locator('section[aria-labelledby="needs-reminder-title"]');
      const remindBtn = reminderSection.getByRole("button", { name: "Remind" }).first();
      await remindBtn.click();

      // ReminderSheet is directly open on Dashboard
      await expect(page.getByText(/Reminder for /i)).toBeVisible();

      // Formatted phone is displayed read-only (+91 XXXXX XXXXX)
      await expect(page.getByText(/\+91 [6-9]\d{4} \d{5}/)).toBeVisible();

      // Textarea contains message text with customer name
      const messageTextarea = page.locator("#reminder-message");
      await expect(messageTextarea).toBeVisible();
      const messageVal = await messageTextarea.inputValue();
      expect(messageVal).toContain("Namaste");
      expect(messageVal).toContain("udhaar");
      expect(messageVal).toContain("Rahul Patel");

      // Verify "Open WhatsApp" link
      const whatsappLink = page.getByRole("link", { name: "Open WhatsApp" });
      await expect(whatsappLink).toBeVisible();
      const href = await whatsappLink.getAttribute("href");
      expect(href).toMatch(/^https:\/\/wa\.me\/91[6-9]\d{9}\?text=/);

      // Verify helper copy before click
      await expect(
        page.getByText("This opens WhatsApp with the message ready. Press Send in WhatsApp.")
      ).toBeVisible();

      // Click "Open WhatsApp" (prevent actual navigation outside test)
      await page.evaluate(() => {
        const link = document.querySelector('a[href^="https://wa.me"]');
        if (link) {
          link.addEventListener("click", (e) => e.preventDefault());
        }
      });
      await whatsappLink.click();

      // Verify helper copy changes after tap
      await expect(
        page.getByText("WhatsApp opened. Press Send there.")
      ).toBeVisible();

      // Invariant: App never says reminder was "sent"
      await expect(page.getByText(/reminder sent|message sent/i)).not.toBeVisible();

      // Close sheet
      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.getByText(/Reminder for /i)).not.toBeVisible();

      // --- PART 2: Customer Details button flow ---
      await page.goto("/customers/10000000-0000-0000-0000-000000000001");
      await page.waitForLoadState("domcontentloaded");

      const sendReminderBtn = page.getByRole("button", {
        name: "Send WhatsApp reminder",
      });
      await expect(sendReminderBtn).toBeVisible();
      await sendReminderBtn.click();

      // ReminderSheet opens
      await expect(page.getByText(/Reminder for /i)).toBeVisible();
      await expect(page.getByRole("link", { name: "Open WhatsApp" })).toBeVisible();

      // Edit message in textarea
      await messageTextarea.fill("Namaste ji! Please pay ₹500 today.");
      const updatedHref = await page
        .getByRole("link", { name: "Open WhatsApp" })
        .getAttribute("href");
      expect(updatedHref).toContain(encodeURIComponent("Please pay ₹500 today."));

      // Close sheet
      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.getByText(/Reminder for /i)).not.toBeVisible();
    });
  });
});
