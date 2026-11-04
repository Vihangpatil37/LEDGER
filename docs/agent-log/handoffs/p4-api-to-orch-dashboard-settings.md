# Handoff p4-api-to-orch-dashboard-settings
Type: DELIVERY
From: API   To: ORCH   Phase: 4   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 4 Task P4-T1 (Dashboard, Reminders, and Settings Server Implementations):

1. **Dashboard Server Reader (`src/lib/server/dashboard.ts`)**:
   - Live implementation of `getDashboard()` with all fixture fallbacks removed.
   - Calls atomic PostgreSQL RPC `dashboard_summary()` for aggregated business figures (`total_outstanding`, `total_advance`, `active_customers`, `alert_customers`, `credit_today`, `payments_today`).
   - Queries `customer_balances` view for customers with `status = 'ALERT'`, ordered by `balance desc`, limit 20.
   - Queries `transaction_ledger` view for the authenticated owner's 10 most recent entries (`created_at desc, id desc`).
   - Returns mapped, typed `DashboardSummary`.

2. **WhatsApp Reminder Draft Generator (`src/lib/server/reminders.ts`)**:
   - Live implementation of `getReminderDraft(customerId)`.
   - Validates customer existence and ownership (`CUSTOMER_NOT_FOUND`).
   - Validates balance due (`NO_BALANCE_DUE` if balance <= 0).
   - Validates canonical phone format (`INVALID_PHONE` if invalid).
   - Fetches live shop settings and owner's reminder template via `getSettings()`.
   - Renders template using `renderReminder` with customer name, plain formatted balance, and shop name.
   - Returns typed `ReminderDraft`.

3. **Shop Settings Reader (`src/lib/server/settings.ts`)**:
   - Live implementation of `getSettings()`.
   - Queries `profiles` table for `user.id`.
   - Maps database columns (`shop_name`, `owner_name`, `phone`, `default_alert_step`, `reminder_template`) to `Settings` contract.

4. **Settings Server Action (`src/app/(app)/settings/actions.ts`)**:
   - `updateSettingsAction`:
     - Validates input using `updateSettingsSchema`.
     - Validates and normalizes phone number if provided (`INVALID_PHONE` on invalid input).
     - Validates reminder template (10..800 chars, enforces required `{name}` and `{amount}` tags, forbids unapproved tags).
     - Updates `profiles` record for `user.id`.
     - Revalidates `/settings`, `/`, and `/customers`.
     - Returns updated `Settings`.
   - Cleanly re-exported in `src/app/actions.ts`.

5. **Unit Tests (`tests/unit/settings-validation.test.ts`)**:
   - Schema validation for full and minimal inputs.
   - Trimming and null conversions for shop/owner names.
   - Length boundaries (<= 60 chars for names, 10..800 for template).
   - Phone normalization rules.
   - Placeholder rules for reminder templates (`{name}`, `{amount}`, `{shop}`).

## Files touched (paths)
- `src/lib/server/dashboard.ts`
- `src/lib/server/settings.ts`
- `src/lib/server/reminders.ts`
- `src/app/(app)/settings/actions.ts`
- `src/app/actions.ts`
- `tests/unit/settings-validation.test.ts`

## Contract impact
None. Strictly complies with locked contracts in Sections 5.4, 6.3, 6.4, and 6.5.

## How to verify
1. Run `pnpm typecheck` (`tsc --noEmit`): Compiles cleanly without errors.
2. Run `pnpm test` (`vitest run`): All test suites pass, including `tests/unit/settings-validation.test.ts`.

## Known limits
- Live database queries require Supabase instance running with migrations 0001-0005 applied.

## Blocking question
None.
