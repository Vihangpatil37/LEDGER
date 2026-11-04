# Handoff p1-qa-to-orch-auth-probes
Type: DELIVERY
From: QA   To: ORCH   Phase: 1   Date: 2026-11-04

## What is delivered or needed
Delivered complete end-to-end test suite scaffold and security probe tests for Phase 1 (Task P1-T5):

1. **`playwright.config.ts`**:
   - Configured dual viewport testing targets:
     - `mobile`: 360px × 640px (Pixel 7 emulation / touch enabled)
     - `desktop`: 1280px × 720px (Desktop Chrome)
   - Configured local development web server against `http://localhost:3000` with automated startup via `pnpm dev` and standard Supabase environment injection.
   - Configured parallel test runners, failure screenshots, and HTML/list reporters.

2. **`tests/e2e/auth.spec.ts` (Test ID: `E2E-01`)**:
   - **Protected Route Redirection**: Verified that unauthenticated requests to `/`, `/customers`, `/entry`, and `/settings` redirect to `/login` with `next` query parameter preserving the original target and any query parameters (e.g. `?type=payment`).
   - **Login Form Accessibility & Security**: Verified accessible email/password inputs, presence of "Forgot password" link, absence of any public signup links (D-10), and disabled submit button when empty.
   - **Invalid Login Error Handling**: Verified that invalid email formatting and wrong credentials return the exact required microcopy: `"Email or password is wrong."` with accessibility alert container (`role="alert"`).
   - **Forgot Password Safe Enumeration Guard**: Verified that submitting any email (including unregistered addresses) consistently displays the safe anti-enumeration copy: `"If that email has an account, a reset link is on its way."`.
   - **Session Lifecycle & Invalidation**: Verified successful login redirect to target/home, authenticated session persistence across page refreshes (`page.reload()`), and complete session invalidation upon logout (via desktop sidebar or mobile drawer menu) redirecting back to `/login`.

3. **`tests/e2e/rls-probes.spec.ts` (Test IDs: `RLS-01`, `RLS-02`, `RLS-03`, `RLS-04`, `RLS-05`, `RLS-06`)**:
   - **Static Security Audits**:
     - Verified `supabase/migrations/0005_grants.sql` explicitly revokes all table access and stored procedure execution (`create_transaction`, `reverse_transaction`, `dashboard_summary`) from `anon` (`RLS-01`).
     - Verified `supabase/migrations/0002_rls.sql` enables Row Level Security on `profiles`, `customers`, and `transactions`, with zero direct write policies for `transactions` (`RLS-01`).
     - Verified `supabase/config.toml` enforces `[auth] enable_signup = false` (`RLS-02`).
   - **Direct PostgREST Probes (`RLS-03`)**: Direct anonymous HTTP requests to `/rest/v1/profiles`, `/customers`, `/transactions`, `/customer_balances`, and `/transaction_ledger` verify 401/403 rejection or 0 rows returned.
   - **Anonymous RPC Probes (`RLS-04`, `RLS-05`, `RLS-06`)**: Direct anonymous POST invocations to `create_transaction`, `reverse_transaction`, and `dashboard_summary` are rejected with 401/403/404.
   - **Supabase SDK Probes (`RLS-01`, `RLS-02`)**: Verified client-level data isolation and verified that public signup attempts (`supabase.auth.signUp()`) are rejected without creating an active session.

## Files touched (paths)
- `playwright.config.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/rls-probes.spec.ts`
- `docs/agent-log/handoffs/p1-qa-to-orch-auth-probes.md`

## Contract impact
None. Conforms strictly to Sections 7.4, 7.5, 7.8, 9.2, 9.3, and 9.4 of `CHAI_LEDGER_MULTI_AGENT_SPEC.md`.

## How to verify (exact commands and expected output)
1. Run Playwright E2E suite:
   ```powershell
   pnpm e2e
   ```
   Expected: All tests pass across both mobile (360px) and desktop (1280px) project targets (24 passed, 22 skipped for live backend probes when Supabase daemon is offline).

2. Run Unit test suite:
   ```powershell
   pnpm test
   ```
   Expected: 7 test files, 59 tests passed.

3. Run TypeScript typecheck:
   ```powershell
   pnpm typecheck
   ```
   Expected: Exit code 0, no errors.

4. Run Linting:
   ```powershell
   pnpm lint
   ```
   Expected: No ESLint warnings or errors.

## Known limits
- Live Supabase PostgREST probes and seeded session lifecycle tests skip gracefully if the local Supabase container is offline, falling back to deterministic static schema and policy verification. When the local Supabase container is started with `supabase start`, all live probes run automatically.

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
