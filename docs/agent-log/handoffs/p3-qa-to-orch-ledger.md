# Handoff p3-qa-to-orch-ledger
Type: DELIVERY
From: QA   To: ORCH   Phase: 3   Date: 2026-11-04

## What is delivered or needed
Completed Phase 3 Task P3-T4 (Ledger Property Testing, Idempotency, Advance, Reversals, and E2E Tests):

1. **Balance Property Test Suite (`tests/unit/balance-property.test.ts`)**:
   - `M-PROP-01`: 150 randomized sequences of CREDIT, PAYMENT, and linked REVERSAL operations with intermediate invariant assertions verifying:
     `balance === SUM(amount where type = 'CREDIT') - SUM(amount where type = 'PAYMENT')`
     using pure integer paise.
   - `M-PROP-02`: Complete reversal rewind test proving 100% reversals return balance to exactly 0 paise and status CLEAR.
   - `DB-06`: Customer with 0 transactions has balance 0 and status CLEAR.
   - `DB-07`: Credit 500 then payment 200 gives balance 300 and status OWING.
   - `DB-08`: Payment exceeding balance without confirmation raises `ADVANCE_CONFIRMATION_REQUIRED`; with confirmation results in negative balance and status ADVANCE.
   - `DB-09`: Idempotent replay on duplicate transaction creation does not alter transaction count or balance.
   - `DB-11` & `DB-12`: Reversal of credit creates linked opposite PAYMENT row; restores prior balance; original is marked reversed; second reversal raises `ALREADY_REVERSED`; reversing a reversal raises `CANNOT_REVERSE_REVERSAL`.
   - `DB-13`: Reversal reason shorter than 3 characters is rejected with `VALIDATION_FAILED`.
   - All 10 unit test files (90 tests) passing (`pnpm test`).

2. **Playwright E2E Suite (`tests/e2e/ledger.spec.ts`)**:
   - `E2E-05`: Fast entry flow: select customer, amount 50, Chai note chip, save udhaar -> ResultSheet displays updated balance and Done button.
   - `E2E-06`: Rapid double-click on Save button produces exactly one ledger entry due to idempotency key guard.
   - `E2E-07`: Simulated network abort displays InlineError ("Not saved. Check your connection and try again."), keeps form inputs, retry saves once.
   - `E2E-08`: Payment > balance triggers ConfirmSheet ("Payment is more than the balance."), "Change amount" returns to form, "Save as advance" records advance and displays "Advance ₹X" hero balance.
   - `E2E-09`: Reversal flow: tap ledger row -> ReverseSheet opens -> enter reason (>= 3 chars) -> "Reverse entry" -> original struck-through "Reversed", new reversal row created, balance restored; second reversal rejected with ALREADY_REVERSED.
   - `E2E-10`: Pagination: "Load older entries" loads next page of transactions while preserving running balance consistency.
   - Performance benchmark: Timed mobile fast entry run measured at 2.45s (spec requires <= 15s) across 5 user steps on 360x640 emulation.

3. **Mock Supabase Test Harness Updates (`tests/e2e/mock-supabase.ts`)**:
   - Added in-memory transaction store and running balance computer.
   - Added `POST /rest/v1/rpc/create_transaction` handler with idempotency replay, credit on inactive blocking, and advance payment checks.
   - Added `POST /rest/v1/rpc/reverse_transaction` handler with idempotency replay, reason validation (3..140 chars), already-reversed guard, and cannot-reverse-reversal guard.
   - Added `GET /rest/v1/transaction_ledger` with customer filtering, order, and cursor pagination.
   - Seeded pagination customer (Priya Sharma) with 55 transactions.

4. **Bug Filed**:
   - `docs/agent-log/bugs/BUG-002.md` (Severity: S2, Owner: UI): `EntryView.tsx` line 148 passes `description: note.trim() || undefined` when note is left empty. Because `createTransactionSchema` uses `noteString` (`z.string().nullable()`), `undefined` causes `VALIDATION_FAILED` ("Please check transaction details.") instead of allowing the optional note to be omitted.

## Files touched (paths)
- `tests/unit/balance-property.test.ts`
- `tests/e2e/ledger.spec.ts`
- `tests/e2e/mock-supabase.ts`
- `docs/agent-log/bugs/BUG-002.md`
- `docs/agent-log/handoffs/p3-qa-to-orch-ledger.md`

## Contract impact
None. Strictly verifies contracts in Section 5.4, 6.3, and 6.4.

## How to verify
1. Run Unit Tests:
   ```powershell
   pnpm test
   ```
   Expected output: 10 test files passed, 90 tests passed (including `balance-property.test.ts`).
2. Run Playwright E2E Tests:
   ```powershell
   pnpm exec playwright test tests/e2e/ledger.spec.ts
   ```
   Expected output: All test cases pass across mobile and desktop.

## Known limits
- `BUG-002` (S2): UI needs to update `EntryView.tsx` line 148 to pass `null` or `""` instead of `undefined` when Note is empty so optional notes save cleanly.

## Blocking question
None.
