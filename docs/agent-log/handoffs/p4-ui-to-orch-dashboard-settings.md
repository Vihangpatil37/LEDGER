# Handoff p4-ui-to-orch-dashboard-settings
Type: DELIVERY
From: UI   To: ORCH   Phase: 4   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 4 Tasks P4-T2 and P4-T3 (Dashboard and Settings Screens, Live Reminder Sheet):

1. **Dashboard View Polish & Direct Reminder Action (`src/components/screens/DashboardView.tsx`, `src/app/(app)/page.tsx`)**:
   - Quick action buttons (56px tall): "Add udhaar" (variant `owed`) and "Add payment" (variant `paid`).
   - "Needs a reminder" list:
     - Displays customers with status `ALERT`, ordered by balance descending.
     - Each row displays: Customer Name (16px bold), "Crossed ₹<level × step>" in `--alert-ink`, and balance right-aligned in `--owed`.
     - Trailing "Remind" button opens `ReminderSheet` directly on Dashboard with dynamically rendered message via `renderReminder`, pre-filling customer information and Click-to-Chat WhatsApp URL without navigating away.
     - Empty state matching Section 7.6.1 verbatim: "No customer has crossed their alert step."
   - "Today" definition list: Udhaar given (`creditToday`), Payments received (`paymentsToday`).
   - "All customers" definition list: Total outstanding (`totalOutstanding`), Advance held (`totalAdvance`, hidden when 0 or "0.00"), Active customers (`activeCustomers`).
   - "Recent entries": last 10 rows from `data.recent` with clickable links to `/customers/[id]`. Empty state matching Section 7.8 verbatim: "No entries yet."
   - Desktop 2-column layout: left column (Needs a reminder, Recent entries), right 320px column (Today, All customers).

2. **Settings Screen & Live Preview (`src/components/screens/SettingsView.tsx`, `src/app/(app)/settings/page.tsx`)**:
   - Server page fetches profile data via `getSettings()`.
   - Form fields:
     - Shop name (optional, max 60 chars)
     - Owner name (optional, max 60 chars)
     - Owner mobile number (optional, 10-digit mobile number)
     - Default alert step (numeric input with helper text explaining alert trigger multiples)
     - WhatsApp reminder template (textarea with helper text explaining `{name}`, `{amount}`, and `{shop}`)
   - Real-time live sample preview box:
     - Renders preview using `renderReminder(template, { name: "Rahul Patel", amount: "500", shop: shopName || "Chai Stall" })`.
     - Validates template client-side with `validateReminderTemplate(template)` ensuring `{name}` and `{amount}` are present and length is within 10..800 characters.
   - Primary "Save settings" button with pending state "Saving…" and success feedback "Settings saved."
   - Error handling via `InlineError` linked to inputs.
   - Account section:
     - Link to change password (`/forgot-password`).
     - "Log out" button calling `logoutAction` with pending state "Logging out…".

3. **Design & System Compliance**:
   - Strictly light theme, Atkinson Hyperlegible font, tabular numerals on all money amounts.
   - Minimum 48px touch targets for all interactive controls.
   - Verbatim sentence case microcopy per Section 7.8.

## Files touched (paths)
- `src/components/screens/DashboardView.tsx`
- `src/components/screens/SettingsView.tsx`
- `src/app/(app)/page.tsx`
- `src/app/(app)/settings/page.tsx`
- `docs/agent-log/handoffs/p4-ui-to-orch-dashboard-settings.md`

## Contract impact
None. All components adhere strictly to Section 6 contracts and Section 7.6 screen specifications.

## How to verify
1. Run `pnpm typecheck`:
   - Passes with 0 errors (`tsc --noEmit`).
2. Run `pnpm lint`:
   - Passes with 0 warnings or errors (`next lint`).
3. Run `pnpm build`:
   - All 12 routes compile and generate successfully.
4. Manual verification:
   - Navigate to `/`:
     - Test "Add udhaar" and "Add payment" buttons.
     - In "Needs a reminder", click "Remind" on any row: verify `ReminderSheet` opens directly on Dashboard with message pre-filled.
     - In "Recent entries", click any entry: verify navigation to `/customers/[id]`.
   - Navigate to `/settings`:
     - Edit reminder template: verify live sample preview updates in real-time.
     - Clear `{amount}` or `{name}`: verify validation error prevents saving.
     - Click "Save settings": verify "Saving…" state, success banner "Settings saved.", and persistence.
     - Click "Log out": verify redirect to `/login`.

## Known limits
None.

## Blocking question
None.
