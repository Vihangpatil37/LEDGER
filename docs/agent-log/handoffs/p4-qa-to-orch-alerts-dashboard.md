# Handoff p4-qa-to-orch-alerts-dashboard
Type: DELIVERY
From: QA   To: ORCH   Phase: 4   Date: 2026-11-04

## What is delivered or needed
Delivered test coverage and verification for Phase 4 (Task P4-T4):
1. Unit Tests (`tests/unit/alerts.test.ts`):
   - Exhaustive alert matrix coverage for AL-01 to AL-08 per Section 9.1 & 9.2 (`computeAlert` logic matching PostgreSQL `create_transaction` RPC).
   - Verifies alert level calculations, crossed amount calculation in integer paise, and D-05 invariant (payments, reversals, and idempotent replays never produce alerts).
   - 16 tests implemented and verified passing.
2. Mock Supabase Server Enhancements (`tests/e2e/mock-supabase.ts`):
   - Added `POST /rest/v1/rpc/dashboard_summary` returning live calculated aggregates (`total_outstanding`, `total_advance`, `active_customers`, `alert_customers`, `credit_today`, `payments_today`).
   - Added support for mutable owner profile & settings in memory with GET and PATCH on `/rest/v1/profiles` and `/rest/v1/settings`.
   - Added filtering on `customer_balances` for `status=eq.ALERT`, ordering by `balance.desc`, and `limit`.
   - Added cross-customer transaction queries on `/rest/v1/transaction_ledger` for dashboard recent entries.
3. E2E Dashboard Suite (`tests/e2e/dashboard.spec.ts`):
   - E2E-11: Dashboard summary verification covering "Needs a reminder" list (alert customers, crossed amounts, Remind action), "Today" figures (Udhaar given, Payments received), "All customers" figures (Total outstanding, Advance held, Active count), and "Recent entries".
   - E2E-12: WhatsApp reminder flow from both Dashboard (direct Remind button) and Customer Details ("Send WhatsApp reminder"), verifying read-only formatted phone (+91 XXXXX XXXXX), generated reminder draft, `wa.me` href with phone & URI-encoded message, dynamic helper copy transition upon click ("WhatsApp opened. Press Send there."), and strict invariant that app never claims reminder was sent.
4. E2E Settings Suite (`tests/e2e/settings.spec.ts`):
   - E2E-13: Live template preview verification in real-time on shop name and template edits, and template placeholder validation blocking invalid templates (missing `{name}` or `{amount}`) and disabling Save button.
   - E2E-14: Settings persistence verification (updating stall details and alert step, saving, reloading page, and asserting persisted values).
5. All 12 unit test files (120 tests) pass cleanly (`pnpm test`).
6. Verified BUG-002 fix in `src/components/screens/EntryView.tsx` line 148 (empty notes trimmed to `null`).

## Files touched (paths)
- `tests/unit/alerts.test.ts` (created)
- `tests/e2e/mock-supabase.ts` (updated)
- `tests/e2e/dashboard.spec.ts` (created)
- `tests/e2e/settings.spec.ts` (created)
- `tests/unit/settings-validation.test.ts` (updated length boundary test)
- `docs/agent-log/bugs/BUG-002-empty-description-persisted.md` (marked closed)
- `docs/agent-log/handoffs/p4-qa-to-orch-alerts-dashboard.md` (created)

## Contract impact
None. No public API or database schema contracts changed. All tests conform to `@/lib/contracts/*`.

## How to verify
1. Run unit test suite:
   ```bash
   pnpm test
   ```
   Expected output: 12 test files passed, 120 tests passed (including `tests/unit/alerts.test.ts` 16 tests).
2. Run Playwright dashboard suite:
   ```bash
   pnpm exec playwright test tests/e2e/dashboard.spec.ts --project=desktop
   ```
   Expected output: 2 passed (E2E-11 and E2E-12).
3. Run full E2E test suite:
   ```bash
   pnpm e2e
   ```
   Expected output: All test suites pass.

## Known limits
- WhatsApp integration relies on client `wa.me` URI scheme dispatch; real WhatsApp client delivery cannot be observed or confirmed by design (invariant respected).

## Blocking question
None.
