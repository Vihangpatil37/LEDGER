# Handoff p3-api-to-orch-transactions
Type: DELIVERY
From: API   To: ORCH   Phase: 3   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 3 Task P3-T1 (Transaction actions & ledger reader with idempotency and RPC mapping):

1. **Transaction Creation Server Action (`src/app/(app)/entry/actions.ts`)**:
   - `createTransactionAction`:
     - Validates input with `createTransactionSchema` (uuid `customerId`, `type` CREDIT/PAYMENT, `amountString`, `noteString`, uuid `idempotencyKey`, boolean `confirmAdvance`).
     - Session authentication via `safeRequireUser()`.
     - Calls atomic PostgreSQL RPC `create_transaction` passing `{ p_customer_id, p_type, p_amount, p_description, p_idempotency_key, p_confirm_advance }`.
     - Maps application errors: `CUSTOMER_NOT_FOUND`, `CUSTOMER_INACTIVE` ("Inactive. New udhaar is blocked."), `AMOUNT_OUT_OF_RANGE`, `VALIDATION_FAILED`.
     - Extracts `ADVANCE_CONFIRMATION_REQUIRED` error with details `{ balance, amount, advanceAfter }` for the UI `ConfirmSheet`.
     - Maps jsonb result via `mapCreateTransactionResult` returning `CreateTransactionResult` (`replayed`, `transaction`, `customer`, `balanceBefore`, `balanceAfter`, `alert`).
     - Revalidates `/`, `/customers`, and `/customers/${customerId}`.

2. **Transaction Reversal Server Action (`src/app/(app)/customers/[id]/actions.ts`)**:
   - `reverseTransactionAction`:
     - Validates input with `reverseTransactionSchema` (uuid `transactionId`, trimmed reason between 3 and 140 chars, uuid `idempotencyKey`).
     - Session authentication via `safeRequireUser()`.
     - Calls atomic PostgreSQL RPC `reverse_transaction` passing `{ p_transaction_id, p_reason, p_idempotency_key }`.
     - Maps application errors: `TRANSACTION_NOT_FOUND`, `ALREADY_REVERSED`, `CANNOT_REVERSE_REVERSAL`, `VALIDATION_FAILED`.
     - Maps result via `mapReverseTransactionResult` returning `ReverseTransactionResult`.
     - Revalidates `/`, `/customers`, and `/customers/[id]`.

3. **Ledger Reader (`src/lib/server/transactions.ts`)**:
   - Real implementation of `getLedger({ customerId, before? })`:
     - Queries `transaction_ledger` view filtered by `customer_id` and `owner_id`.
     - Ordered newest first (`created_at desc, id desc`), page size 50.
     - Supports cursor pagination via format `"<created_at>|<id>"`.
     - Formats running balances and amounts via `mapLedgerEntry`.

4. **Action Re-exports (`src/app/actions.ts`)**:
   - Updated `src/app/actions.ts` to re-export `createTransactionAction` and `reverseTransactionAction` for root access.

5. **Unit Tests (`tests/unit/transaction-validation.test.ts`)**:
   - Tests `createTransactionSchema` (credit/payment, note transformations, invalid amounts, uuid validation, confirmAdvance default).
   - Tests `reverseTransactionSchema` (minimum 3 characters reason per DB-13 rule, max 140 characters).
   - Tests RPC response mappers (`mapCreateTransactionResult` and `mapReverseTransactionResult`).

## Files touched (paths)
- `src/app/(app)/entry/actions.ts`
- `src/app/(app)/customers/[id]/actions.ts`
- `src/lib/server/transactions.ts`
- `src/lib/server/mappers.ts`
- `src/lib/server/errors.ts`
- `src/app/actions.ts`
- `tests/unit/transaction-validation.test.ts`

## Contract impact
None. Strictly satisfies locked contracts in Sections 5.4, 6.3, 6.4, and 6.5.

## How to verify
1. Run `pnpm typecheck` (`tsc --noEmit`): Clean compilation without errors.
2. Run `pnpm test` (`vitest run`): All unit tests pass across pure libs, mappers, customer validation, and transaction validation.

## Known limits
- Live execution requires running PostgreSQL instance with migrations 0001-0005 applied.

## Blocking question
None.
