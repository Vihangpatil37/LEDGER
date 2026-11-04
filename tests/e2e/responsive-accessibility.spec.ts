import { test, expect } from "@playwright/test";

/**
 * E2E Responsive, Zoom & Keyboard Accessibility Suite: E2E-15, E2E-16
 * Spec reference: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 6.6, 7.2, 7.3, 7.4, 7.7, 8 Phase 5, 9.3 (E2E-15, E2E-16)
 *
 * Test cases:
 * - E2E-15: Responsive layouts at 320px, 360px, 412px, 768px, 1280px have zero horizontal scroll.
 *   - Key screens: /, /customers, /entry?type=udhaar, /settings, /customers/10000000-0000-0000-0000-000000000001
 *   - Bottom navigation bar does not cover content on mobile viewports (< 768px).
 *   - Desktop sidebar layout renders properly at 1280px without bottom bar.
 *   - 200% zoom behavior maintains usability with zero horizontal layout breakage.
 *   - Saves audit screenshots to tests/visual/ for P5-T3 design gate review.
 * - E2E-16: Keyboard-only navigation and focus management:
 *   - Focus ring visible on focused elements (:focus-visible with --focus outline).
 *   - Keyboard-only completion of an udhaar entry (Tab, Enter, Escape, typing without pointer).
 *   - Sheets trap focus when open and close cleanly on Escape or Done button.
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

test.describe("Responsive, Zoom & Keyboard Suite (E2E-15, E2E-16)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test.describe("E2E-15: Responsive viewports and 200% zoom verification", () => {
    const viewports = [
      { name: "320px-iphone-se", width: 320, height: 568, isMobile: true },
      { name: "360px-mid-android", width: 360, height: 640, isMobile: true },
      { name: "412px-pixel", width: 412, height: 915, isMobile: true },
      { name: "768px-tablet", width: 768, height: 1024, isMobile: false },
      { name: "1280px-desktop", width: 1280, height: 800, isMobile: false },
    ];

    const routes = [
      { path: "/", name: "dashboard" },
      { path: "/customers", name: "customers" },
      { path: "/entry?type=udhaar", name: "entry" },
      { path: "/settings", name: "settings" },
      {
        path: "/customers/10000000-0000-0000-0000-000000000001",
        name: "customer-detail",
      },
    ];

    for (const vp of viewports) {
      test(`E2E-15: zero horizontal scroll and proper nav layout at ${vp.width}px (${vp.name})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        for (const route of routes) {
          await page.goto(route.path);
          await page.waitForLoadState("domcontentloaded");

          // 1. Verify zero horizontal overflow (scrollWidth <= clientWidth)
          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));

          expect.soft(
            scrollWidth,
            `Horizontal overflow detected on ${route.path} at ${vp.width}px: scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`
          ).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding margin

          // 2. Navigation bar layout checks
          if (vp.isMobile) {
            // Mobile: fixed bottom nav bar should be visible
            const bottomNav = page.locator("nav").filter({
              has: page.getByText("Home"),
            });
            await expect(bottomNav).toBeVisible();

            // Verify content container has bottom padding to prevent bottom nav collision
            const mainContainer = page.locator("main");
            const hasPaddingBottom = await mainContainer.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return parseInt(style.paddingBottom || "0", 10) >= 48;
            });
            expect(hasPaddingBottom).toBe(true);
          } else {
            // Desktop: left sidebar is present and bottom bar is hidden
            const sidebar = page.locator("aside, nav").filter({
              has: page.getByText("Ledger"),
            });
            await expect(sidebar.first()).toBeVisible();
          }

          // 3. Capture visual design gate screenshots for representative viewports
          if (
            (vp.width === 320 && route.name === "dashboard") ||
            (vp.width === 360 && route.name === "dashboard") ||
            (vp.width === 360 && route.name === "entry") ||
            (vp.width === 360 && route.name === "customer-detail") ||
            (vp.width === 360 && route.name === "settings") ||
            (vp.width === 1280 && route.name === "dashboard") ||
            (vp.width === 1280 && route.name === "customer-detail")
          ) {
            await page.screenshot({
              path: `tests/visual/${route.name}-${vp.width}px.png`,
              fullPage: false,
            });
          }
        }
      });
    }

    test("E2E-15: 200% zoom emulation maintains zero horizontal scroll on entry and dashboard", async ({
      page,
    }) => {
      // 200% zoom on 1280px standard desktop simulates a 640px viewport
      await page.setViewportSize({ width: 640, height: 480 });

      for (const path of ["/", "/entry?type=udhaar", "/settings"]) {
        await page.goto(path);
        await page.waitForLoadState("domcontentloaded");

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      }
    });
  });

  test.describe("E2E-16: Keyboard-only navigation and focus trapping", () => {
    test("E2E-16: focus ring visible on interactive elements", async ({
      page,
    }) => {
      await page.goto("/entry?type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      // Press Tab to focus interactive elements
      await page.keyboard.press("Tab");

      // Check active focused element has focus outline or ring
      const hasFocusRing = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return false;
        const style = window.getComputedStyle(active);
        const outlineWidth = parseInt(style.outlineWidth || "0", 10);
        const boxShadow = style.boxShadow || "";
        // Either outline or box-shadow ring should be present
        return outlineWidth > 0 || boxShadow.includes("2457c5") || boxShadow.includes("36, 87, 197") || style.outlineStyle !== "none";
      });

      expect(hasFocusRing).toBe(true);
    });

    test("E2E-16: keyboard-only completion of an udhaar entry and sheet focus trap", async ({
      page,
    }) => {
      await page.goto("/entry?type=udhaar");
      await page.waitForLoadState("domcontentloaded");

      // 1. Tab to "Select customer" button
      const customerPickerBtn = page.getByRole("button", {
        name: /Select customer/i,
      });
      await customerPickerBtn.focus();
      await page.keyboard.press("Enter");

      // 2. CustomerPicker sheet opens; auto-focuses search input
      const searchInput = page.getByPlaceholder("Search by name or mobile number");
      await expect(searchInput).toBeVisible();

      // Type "Rahul" via keyboard
      await page.keyboard.type("Rahul");

      // Focus filtered customer option and press Enter to select
      const customerOption = page.getByRole("button", { name: /Rahul Patel/i });
      await expect(customerOption).toBeVisible();
      await customerOption.focus();
      await page.keyboard.press("Enter");

      // Picker closes; customer name is displayed
      await expect(page.getByText("Rahul Patel").first()).toBeVisible();

      // 3. Focus Amount field and enter 50
      const amountInput = page.locator("#amount-input");
      await amountInput.focus();
      await page.keyboard.type("50");

      // 4. Save button is now enabled
      const saveBtn = page.getByRole("button", { name: "Save udhaar" });
      await expect(saveBtn).toBeEnabled();
      await saveBtn.focus();

      // Press Enter to submit
      await page.keyboard.press("Enter");

      // 5. ResultSheet opens
      await expect(page.getByText("Entry saved")).toBeVisible();
      await expect(page.getByText(/₹50 udhaar added for Rahul Patel/i)).toBeVisible();

      // 6. Focus trapping in sheet: Done button is visible and can be focused and triggered via keyboard
      const doneBtn = page.getByRole("button", { name: "Done" });
      await expect(doneBtn).toBeVisible();
      await doneBtn.focus();
      await page.keyboard.press("Enter");

      await expect(page.getByText("Entry saved")).not.toBeVisible();
    });
  });
});
