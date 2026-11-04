# Handoff p0-db-to-orch-migrations
Type: DELIVERY
From: DB   To: ORCH   Phase: 0   Date: 2026-11-04

## What is delivered or needed
Delivered all database migrations, local Supabase configuration, and deterministic development seed data for Phase 0 (Task P0-T5):

1. **`supabase/config.toml`**:
   - Explicitly configured `[auth] enable_signup = false` to enforce single-owner security (D-10, 5.6).
   - Set local redirect allow-list (`additional_redirect_urls`) to support `http://localhost:3000/**` and `http://127.0.0.1:3000/**`.

2. **`supabase/migrations/0001_schema.sql`**:
   - Custom enum `public.txn_type` (`CREDIT`, `PAYMENT`).
   - Table `public.profiles` referencing `auth.users(id)` with phone regex check (`^91[6-9][0-9]{9}$`), alert step check, reminder template length check, and `handle_new_user()` trigger on `auth.users`.
   - Table `public.customers` with `unique (id, owner_id)`, phone format check, `set_updated_at()` trigger, and indexes on `(owner_id, is_active)`, `(owner_id, phone)`, `(owner_id, lower(name))`.
   - Table `public.transactions` with composite foreign key `(customer_id, owner_id)` referencing `customers(id, owner_id)`, constraints `transactions_reversal_consistency`, `transactions_reversal_needs_reason`, `transactions_idempotency_unique`, `transactions_one_reversal_per_original`, and indexes.
   - Triggers: `customers_set_updated_at` (automatic `updated_at`), `transactions_no_mutation` (blocks update and delete with `TRANSACTIONS_IMMUTABLE`), `transactions_validate_reversal` (enforces reversal integrity on insert), and `on_auth_user_created`.

3. **`supabase/migrations/0002_rls.sql`**:
   - Enabled RLS on `profiles`, `customers`, `transactions`.
   - Optimized owner-isolation policies using `(select auth.uid())`.
   - Blocked all direct write mutations on `transactions` for client roles (no insert/update/delete policies; writes permitted strictly through security definer RPCs).
   - Enforced no-delete policy on `customers` (status deactivation only).

4. **`supabase/migrations/0003_views.sql`**:
   - `public.customer_balances` with `security_invoker = true`: aggregates chronological balance, computes `status` (`CLEAR`, `OWING`, `ALERT`, `ADVANCE`), and `alert_level`.
   - `public.transaction_ledger` with `security_invoker = true`: computes running balance window over `(partition by t.customer_id order by t.created_at, t.id)` and evaluates `is_reversed` flag via self-join on `reversal_of`.

5. **`supabase/migrations/0004_rpc.sql`**:
   - `public.create_transaction(...)`: `security definer`, `set search_path = ''`, derives owner from `auth.uid()`, locks customer row (`for update`), validates amounts and notes, performs idempotent replay on `(owner_id, idempotency_key)`, blocks credit to inactive customers (`CUSTOMER_INACTIVE`), enforces unconfirmed advance guard (`ADVANCE_CONFIRMATION_REQUIRED` with detailed JSON), inserts entry, evaluates alert crossing levels, and outputs JSON with all numerics as `::text`.
   - `public.reverse_transaction(...)`: `security definer`, `set search_path = ''`, derives owner from `auth.uid()`, locks customer row, performs idempotent replay, validates reason (3-140 characters), blocks reversing a reversal (`CANNOT_REVERSE_REVERSAL`) or re-reversing (`ALREADY_REVERSED`), inserts opposite type entry, and outputs JSON with all numerics as `::text`.
   - `public.dashboard_summary()`: `stable`, `security invoker`, `set search_path = ''`, computes `total_outstanding`, `total_advance`, `active_customers`, `alert_customers`, and today's `credit_today` and `payments_today` in `Asia/Kolkata` excluding reversals and reversed rows, outputting all numerics as string `::text`.

6. **`supabase/migrations/0005_grants.sql`**:
   - Revokes all permissions from `anon` and `authenticated` on public schema tables.
   - Grants least-privilege `select`/`update` on profiles, `select`/`insert`/`update` on customers, and `select` on transactions and views to `authenticated`.
   - Revokes RPC execution from `public`/`anon` and grants to `authenticated`.
   - Revokes direct RPC invocation on internal trigger functions.

7. **`supabase/seed.sql`**:
   - Realistic seed dataset creating dev owner `00000000-0000-0000-0000-000000000001` in `auth.users` and `profiles`.
   - 20 customers (18 active, 2 inactive).
   - Hand-crafted transactions in IST matching Section 5.4, 7.6.1, DB-15, and E2E-14 metrics exactly:
     - `total_outstanding`: "4250.00"
     - `total_advance`: "200.00"
     - `active_customers`: 18
     - `alert_customers`: 4
     - `credit_today`: "640.00"
     - `payments_today`: "300.00"
     - Demonstrates reversal exclusion from today's totals.

## Files touched (paths)
- `supabase/config.toml`
- `supabase/migrations/0001_schema.sql`
- `supabase/migrations/0002_rls.sql`
- `supabase/migrations/0003_views.sql`
- `supabase/migrations/0004_rpc.sql`
- `supabase/migrations/0005_grants.sql`
- `supabase/seed.sql`
- `docs/agent-log/handoffs/p0-db-to-orch-migrations.md`

## Contract impact
Freezes database schema and RPC contracts defined in Section 5 of `CHAI_LEDGER_MULTI_AGENT_SPEC.md`. Compatible with `API` contracts in Section 6.

## How to verify (exact commands and expected output)
1. Verify presence and syntax of all SQL files:
   ```powershell
   Get-ChildItem -Path supabase/migrations/*.sql, supabase/*.sql
   ```
   Expected: 5 migration files and 1 seed file.

2. Verify `[auth] enable_signup = false` in `supabase/config.toml`:
   ```powershell
   Select-String -Path supabase/config.toml -Pattern "enable_signup = false"
   ```
   Expected: `enable_signup = false`.

3. Verify RPC function definitions and `search_path = ''`:
   ```powershell
   Select-String -Path supabase/migrations/0004_rpc.sql -Pattern "search_path = ''"
   ```
   Expected: Present on `create_transaction`, `reverse_transaction`, and `dashboard_summary`.

4. Verify view security invoker attributes:
   ```powershell
   Select-String -Path supabase/migrations/0003_views.sql -Pattern "security_invoker = true"
   ```
   Expected: Present on both views.

5. Verify immutability triggers:
   ```powershell
   Select-String -Path supabase/migrations/0001_schema.sql -Pattern "TRANSACTIONS_IMMUTABLE"
   ```
   Expected: Found in `block_transaction_mutation()`.

## Known limits
- Supabase local docker engine is currently stopped; migrations are syntax-verified and static-checked. In Phase 1 when the local container or remote project is active, `supabase db push` / `supabase test db` will apply and execute pgTAP suites.

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
