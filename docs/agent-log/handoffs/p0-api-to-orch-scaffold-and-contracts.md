# Handoff p0-api-to-orch-scaffold-and-contracts
Type: DELIVERY
From: API   To: ORCH   Phase: 0   Date: 2026-11-04

## What is delivered or needed
Completed Phase 0 tasks P0-T1, P0-T2, P0-T3, and P0-T4:
1. **P0-T1 Project Scaffold**:
   - `package.json` created with exact pinned modern dependencies: Next.js 15.1.7, React 19.0.0, TypeScript 5.7.3, Vitest 3.0.5, @supabase/supabase-js 2.49.1, @supabase/ssr 0.5.2, tailwindcss 3.4.17, zod 3.24.2, lucide-react 0.475.0, vaul 1.1.2, cmdk 1.0.4.
   - Pnpm workspace configuration (`pnpm-workspace.yaml`, `.npmrc`) and dependencies installed successfully with approved build scripts for `esbuild` and `sharp`.
   - `tsconfig.json` with `strict: true` and path alias `@/*` pointing to `./src/*`.
   - `next.config.ts` configured with mandatory security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`).
   - `postcss.config.mjs` and `tailwind.config.ts` configured with Chai Ledger design tokens and radii.
   - `vitest.config.ts` configured with path alias and node environment.
   - `src/middleware.ts` scaffolded for route matching.

2. **P0-T2 Contracts (`src/lib/contracts/**`)**:
   - `common.ts`: `APP_ERROR_CODES` (14 error codes), `AppErrorCode`, `ActionResult<T>`, `uuid`, `amountString`, `noteString`.
   - `customers.ts`: `CustomerStatus`, `CustomerBalance`, and Zod action input schemas (`createCustomerSchema`, `updateCustomerSchema`, `setCustomerActiveSchema`).
   - `transactions.ts`: `LedgerEntry`, `CreateTransactionResult`, `ReverseTransactionResult`, and Zod action input schemas (`createTransactionSchema`, `reverseTransactionSchema`).
   - `dashboard.ts`: `DashboardSummary`.
   - `settings.ts`: `Settings`, `ReminderDraft`, and `updateSettingsSchema`.

3. **P0-T3 Pure Libraries & Unit Tests**:
   - `src/lib/money.ts` & `tests/unit/money.test.ts`: `parseAmountToPaise`, `paiseToString`, `moneyToPaise`, `formatINRPlain`, `formatINR`. Zero floating-point arithmetic. Tests M-01, M-02, M-03.
   - `src/lib/phone.ts` & `tests/unit/phone.test.ts`: `normalizePhone`, `isStoredPhone`, `formatPhoneDisplay`. Tests PH-01, PH-02.
   - `src/lib/ist.ts` & `tests/unit/ist.test.ts`: `formatIST` (time, date, datetime), `dayLabelIST` comparing calendar days in `Asia/Kolkata`. Test IST-01 (18:29 vs 18:31 UTC midnight rollover).
   - `src/lib/whatsapp.ts` & `tests/unit/whatsapp.test.ts`: `buildWhatsAppUrl` with proper URL encoding and `INVALID_PHONE` validation. Tests WA-01, WA-02.
   - `src/lib/reminder.ts` & `tests/unit/reminder.test.ts`: `renderReminder`, `validateReminderTemplate`, `DEFAULT_REMINDER_TEMPLATE`. Test RM-01.

4. **P0-T4 Fixtures & Server Stubs**:
   - `src/lib/fixtures/customers.ts`: 18 active customers and 1 inactive customer matching all criteria.
   - `src/lib/fixtures/ledger.ts`: realistic ledger entries including udhaar, payment, advance, and reversals.
   - `src/lib/fixtures/dashboard.ts`: matching exact numbers in Section 5.4/6.3 (`totalOutstanding: "4250.00"`, `totalAdvance: "200.00"`, `activeCustomers: 18`, `alertCustomers: 4`, `creditToday: "640.00"`, `paymentsToday: "300.00"`).
   - `src/lib/fixtures/settings.ts`: default settings and draft reminder.
   - Server readers in `src/lib/server/` (`dashboard.ts`, `customers.ts`, `transactions.ts`, `settings.ts`, `reminders.ts`) and server actions in `src/app/actions.ts` equipped with typed signatures and fixture returns when `CHAI_FIXTURES=1`.

## Files touched (paths)
- `package.json`
- `.npmrc`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `next.config.ts`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `vitest.config.ts`
- `.eslintrc.json`
- `next-env.d.ts`
- `src/middleware.ts`
- `src/lib/contracts/common.ts`
- `src/lib/contracts/customers.ts`
- `src/lib/contracts/transactions.ts`
- `src/lib/contracts/dashboard.ts`
- `src/lib/contracts/settings.ts`
- `src/lib/money.ts`
- `src/lib/phone.ts`
- `src/lib/ist.ts`
- `src/lib/whatsapp.ts`
- `src/lib/reminder.ts`
- `src/lib/fixtures/customers.ts`
- `src/lib/fixtures/ledger.ts`
- `src/lib/fixtures/dashboard.ts`
- `src/lib/fixtures/settings.ts`
- `src/lib/server/dashboard.ts`
- `src/lib/server/customers.ts`
- `src/lib/server/transactions.ts`
- `src/lib/server/settings.ts`
- `src/lib/server/reminders.ts`
- `src/app/actions.ts`
- `tests/unit/money.test.ts`
- `tests/unit/phone.test.ts`
- `tests/unit/ist.test.ts`
- `tests/unit/whatsapp.test.ts`
- `tests/unit/reminder.test.ts`
- `docs/agent-log/LESSONS.md`

## Contract impact
None. Established canonical typed contracts matching Sections 5 and 6 of `CHAI_LEDGER_MULTI_AGENT_SPEC.md`.

## How to verify
1. Run `pnpm typecheck` (`tsc --noEmit`): Expected exit code 0, no type errors.
2. Run `pnpm test` (`vitest run`): Expected 5 test suites pass (money, phone, ist, whatsapp, reminder) covering all spec test IDs: M-01, M-02, M-03, PH-01, PH-02, IST-01, WA-01, WA-02, RM-01.

## Known limits
- Server actions and readers currently return fixture-backed data for Phase 0 (`CHAI_FIXTURES=1`). Real DB integration will be implemented in subsequent phases as defined in the plan.
- Public signup is disabled; authentication and Supabase client plumbing will land in Phase 1.

## Blocking question
None.
