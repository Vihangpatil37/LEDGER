# Handoff p2-api-to-orch-customers
Type: DELIVERY
From: API   To: ORCH   Phase: 2   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 2 Task P2-T1 (Customer readers and actions with duplicate phone detection):

1. **Customer Readers (`src/lib/server/customers.ts`)**:
   - `listCustomers({ q?, status })`: Real Supabase query against `customer_balances` view with session authentication (`requireUser()`). Status filtering ("active" -> `is_active=true`, "inactive" -> `is_active=false`, "all" -> unfiltered). Search filtering `q` by `name.ilike` or `phone.like`. Ordered by `name asc`, max 500. Results mapped via `mapCustomerBalance`.
   - `listCustomersForPicker()`: Real Supabase query on `customer_balances` ordered by `last_activity_at desc nulls last, name asc`, limit 500.
   - `getCustomer(id)`: Real Supabase query on `customer_balances` matching `id` and `owner_id = user.id`. Returns `CustomerBalance` or `null`.

2. **Customer Server Actions (`src/app/(app)/customers/actions.ts`)**:
   - `createCustomerAction`: Validates name (trimmed 1..80), phone (`normalizePhone`, invalid returns `INVALID_PHONE`), and alertStep (> 0). Queries `customers` for duplicate phone under the same `owner_id`. If found and `confirmDuplicate` is false, returns `DUPLICATE_PHONE` with `{ details: { existing: [{ id, name, isActive }] } }`. Inserts row with `owner_id = user.id`, fetches computed `CustomerBalance`, revalidates `/customers` and `/`.
   - `updateCustomerAction`: Validates input, confirms customer exists and belongs to owner, normalizes phone, performs duplicate check excluding the record being edited (`id != id`), updates `customers`, fetches updated `CustomerBalance`, revalidates `/customers`, `/customers/[id]`, and `/`.
   - `setCustomerActiveAction`: Updates `is_active` where `id = id and owner_id = user.id`, revalidates paths, returns updated `CustomerBalance`. Deactivation/reactivation allowed at any balance (D-07).
   - Re-exported via `src/app/actions.ts` for unified action access.

3. **Unit Tests (`tests/unit/customer-validation.test.ts`)**:
   - Tests name boundary conditions (1 to 80 chars, rejects empty, whitespace, >80).
   - Tests alert step boundaries (positive amounts, rejects 0, negative, >100000, >2 decimals).
   - Tests phone normalization and invalid formats.
   - Tests duplicate phone lookup logic and exclusion of edited customer id.

## Files touched (paths)
- `src/lib/server/customers.ts`
- `src/app/(app)/customers/actions.ts`
- `src/app/actions.ts`
- `tests/unit/customer-validation.test.ts`

## Contract impact
None. Implementations strictly satisfy Sections 5.3, 6.3, 6.4, and 6.5 of `CHAI_LEDGER_MULTI_AGENT_SPEC.md`.

## How to verify
1. Run `pnpm typecheck` (`tsc --noEmit`): Compiles cleanly with zero errors.
2. Run `pnpm test` (`vitest run`): All test suites pass, including `tests/unit/customer-validation.test.ts`.

## Known limits
- Supabase instance must be running with migrations 0001-0005 applied for live database execution.

## Blocking question
None.
