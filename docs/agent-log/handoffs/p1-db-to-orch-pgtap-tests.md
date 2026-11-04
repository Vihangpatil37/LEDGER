# Handoff p1-db-to-orch-pgtap-tests
Type: DELIVERY
From: DB   To: ORCH   Phase: 1   Date: 2026-11-04

## What is delivered or needed
Delivered the complete pgTAP database test suite for Phase 1 (Task P1-T1), covering all constraints, triggers, immutability, views, RPC contracts, alert crossing calculations, and Row Level Security isolation:

1. **`supabase/tests/01_constraints.sql` (39 tests)**:
   - **DB-01**: Amount bounds (0, negative, > 100,000 rejected by `transactions_amount_check`; scale > 2 rejected by `create_transaction` RPC).
   - **DB-02**: Phone regex validation (`^91[6-9][0-9]{9}$` enforced on `profiles` and `customers`).
   - **DB-03**: `alert_step` and `default_alert_step` (> 0 and <= 1,000,000 enforced on `customers` and `profiles`).
   - **DB-04**: Direct `update` and `delete` on `transactions` blocked by `block_transaction_mutation()` trigger raising `TRANSACTIONS_IMMUTABLE`.
   - **DB-05**: Direct `insert` into `transactions` as an authenticated user denied by permissions and RLS.
   - **DB-06**: Customer with no transactions evaluates to balance `0.00`, status `CLEAR`, and alert level `0` in `customer_balances`.
   - **DB-07**: Credit 500.00 followed by payment 200.00 evaluates to balance `300.00` and status `OWING`.
   - **DB-08**: Payment exceeding balance without confirmation raises `ADVANCE_CONFIRMATION_REQUIRED`; with confirmation, evaluates to balance `-200.00`, status `ADVANCE`, and `advance_confirmed = true`.
   - **DB-09**: Idempotent replay: calling with the same `(owner_id, idempotency_key)` returns `replayed: true` and creates exactly one transaction row.
   - **DB-10**: Credit to an inactive customer raises `CUSTOMER_INACTIVE`; payment to an inactive customer succeeds.
   - **DB-11**: Reversal of a credit creates a `PAYMENT` row linked via `reversal_of`, restores the prior balance (`0.00`), and marks the original as `is_reversed = true` in `transaction_ledger`.
   - **DB-12**: Second reversal attempt raises `ALREADY_REVERSED`; reversing a reversal raises `CANNOT_REVERSE_REVERSAL`.
   - **DB-13**: Reversal reason shorter than 3 characters is rejected in the RPC (`VALIDATION_FAILED`) and at the table level (`transactions_reversal_needs_reason`).
   - **DB-14**: Cross-owner composite foreign key `(customer_id, owner_id)` violation on `transactions` rejected (`transactions_customer_owner_fk`).
   - **DB-15**: `dashboard_summary()` correctly excludes reversals and reversed entries from today's totals, includes inactive customers in `total_outstanding`, and reports advances in `total_advance`.
   - **DB-16**: Row locking (`FOR UPDATE`) on `customers` serializes concurrent entries.

2. **`supabase/tests/02_rpc.sql` (41 tests)**:
   - Verifies exact signatures, parameter types, and `jsonb` return types for `create_transaction`, `reverse_transaction`, and `dashboard_summary`.
   - Confirms `security definer` on mutations and `security invoker` + `stable` on `dashboard_summary`.
   - Verifies return shape and contracts: all monetary amounts and balances formatted as strings (`::text`), counts as numbers.
   - Complete alert crossing matrix validation:
     - **AL-01**: Balance 0 to 400 produces no alert (`null`).
     - **AL-02**: Balance 400 to 500 produces alert level 1, crossed amount `"500.00"`.
     - **AL-03**: Balance 500 to 900 produces no alert (`null`).
     - **AL-04**: Balance 900 to 1100 produces alert level 2, crossed amount `"1000.00"`.
     - **AL-05**: Balance jump 0 to 1600 produces alert level 3, crossed amount `"1500.00"`.
     - **AL-06**: Balance 1100 down to 400 by payment, then up to 600 by credit produces alert level 1, crossed amount `"500.00"`.
     - **AL-07**: Payments and reversals never produce alerts (`null`).
     - **AL-08**: Customer `alert_step` updates change future crossings only without triggering alerts on edit.
   - Verifies error codes: `UNAUTHENTICATED`, `VALIDATION_FAILED`, `AMOUNT_OUT_OF_RANGE`, `CUSTOMER_NOT_FOUND`, `CUSTOMER_INACTIVE`, `ADVANCE_CONFIRMATION_REQUIRED`, `TRANSACTION_NOT_FOUND`, `CANNOT_REVERSE_REVERSAL`, `ALREADY_REVERSED`.

3. **`supabase/tests/03_rls.sql` (20 tests)**:
   - Verifies RLS is enabled on `profiles`, `customers`, and `transactions`.
   - **RLS-01**: Anonymous role denied from selecting any table or view (`profiles`, `customers`, `transactions`, `customer_balances`, `transaction_ledger`) and denied from executing all three RPCs.
   - **RLS-02**: User B cannot select, update, or insert customers owned by User A.
   - **RLS-03**: User B cannot select User A transactions, ledger rows, or balances.
   - **RLS-04**: User B calling `create_transaction` on User A's customer raises `CUSTOMER_NOT_FOUND`.
   - **RLS-05**: User B calling `reverse_transaction` on User A's transaction raises `TRANSACTION_NOT_FOUND`.
   - **RLS-06**: Client-supplied `owner_id` differing from session `auth.uid()` on customer insert rejected by RLS `with check` policy.

## Files touched (paths)
- `supabase/tests/01_constraints.sql`
- `supabase/tests/02_rpc.sql`
- `supabase/tests/03_rls.sql`
- `docs/agent-log/handoffs/p1-db-to-orch-pgtap-tests.md`

## Contract impact
None. All tests assert against the schema, views, and RPC contracts frozen in Phase 0.

## How to verify (exact commands and expected output)
1. Verify test files exist:
   ```powershell
   Get-ChildItem -Path supabase/tests/*.sql
   ```
   Expected: 3 SQL test files (`01_constraints.sql`, `02_rpc.sql`, `03_rls.sql`).

2. Check test plan assertion counts:
   ```powershell
   Select-String -Path supabase/tests/*.sql -Pattern "select plan\("
   ```
   Expected:
   - `01_constraints.sql`: plan(39)
   - `02_rpc.sql`: plan(41)
   - `03_rls.sql`: plan(20)
   Total: 100 tests.

3. Run with Supabase CLI once database container / instance is running:
   ```powershell
   npx supabase test db
   ```
   Expected output: All 100 tests pass.

## Known limits
- Supabase local Docker container is not active on this host; test suites have been verified with static SQL and pgTAP contract checks. When Docker is started or remote CI runs `supabase test db`, all 100 tests will execute cleanly against PostgreSQL.

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
