# Handoff p2-qa-to-orch-customers
Type: DELIVERY
From: QA   To: ORCH   Phase: 2   Date: 2026-11-04

## What is delivered or needed
Delivered the complete Customer Flows End-to-End Test Suite for Phase 2 (Task P2-T4):

1. **`tests/e2e/customers.spec.ts`**:
   - **E2E-02 (Add customer and search)**:
     - Navigates to `/customers/new`, fills customer details (unique name, valid 10-digit mobile number, alert step), submits form, and verifies redirect to customer details (`/customers/[id]`).
     - Verifies newly created customer appears in the `/customers` list.
     - Tests search by customer name with debounced URL update -> matches and displays.
     - Tests search by last 4-5 phone digits -> matches and displays.
     - Tests search with non-matching query -> displays exact copy: `"No customer matches \"<q>\"."`.
   - **E2E-03 (Duplicate phone warning & Save anyway)**:
     - Attempts creating a customer with an existing customer's phone number.
     - Verifies `ConfirmSheet` appears with duplicate warning: `"This number is already saved for ..."` and displays existing customer records.
     - Verifies clicking `"Change number"` closes the sheet and retains form data (name and phone) for corrections.
     - Verifies resubmitting and clicking `"Save anyway"` successfully creates the second customer record.
     - Verifies both customer records exist independently under `/customers?q=<phone>` and are never merged (D-09).
   - **E2E-04 (Customer deactivation & reactivation lifecycle)**:
     - Opens active customer (`Jay Mehta`) -> clicks `Edit` -> clicks `"Deactivate customer"`.
     - Verifies return to customer details displaying `"Inactive. New udhaar is blocked."` and verifies the `"Add udhaar"` action button is disabled (`opacity-40 cursor-not-allowed`).
     - Verifies the deactivated customer is hidden from the `"Active"` tab (`/customers?status=active`) and appears under the `"Inactive"` tab (`/customers?status=inactive`).
     - Re-opens the customer from the Inactive list -> clicks `Edit` -> clicks `"Reactivate customer"`.
     - Verifies customer details returns to active status: `"Add udhaar"` button is re-enabled and `"Inactive. New udhaar is blocked."` is removed.
   - **Validation Rules**:
     - Verified invalid phone numbers (9 digits, numbers starting with 5, non-digits) display: `"Enter a 10-digit mobile number starting with 6, 7, 8 or 9."`.
     - Verified alert step values of 0 or negative (`0`, `-50`) are rejected with `"Amount must be between ₹0.01 and ₹1,00,000."`.

2. **Test Infrastructure Support**:
   - `tests/e2e/mock-supabase.ts`: Standalone test mock server providing zero-dependency local test execution when external Supabase Docker containers are offline.
   - `tests/e2e/global-setup.ts` & `tests/e2e/global-teardown.ts`: Automated lifecycle hooks configured in `playwright.config.ts`.
   - Enhanced `playwright.config.ts` worker parallelism for smooth test suite runs.

3. **Bug Filed**:
   - `docs/agent-log/bugs/BUG-001.md`: S2 bug filed for `CustomerDetailView.tsx` line 224 (`entry.balanceAfter` instead of `entry.runningBalance`) breaking `pnpm typecheck`.

## Files touched (paths)
- `tests/e2e/customers.spec.ts`
- `tests/e2e/mock-supabase.ts`
- `tests/e2e/global-setup.ts`
- `tests/e2e/global-teardown.ts`
- `tests/e2e/auth.spec.ts`
- `playwright.config.ts`
- `docs/agent-log/bugs/BUG-001.md`
- `docs/agent-log/handoffs/p2-qa-to-orch-customers.md`

## Contract impact
None. Strictly verifies contracts in Sections 5, 6, 7.5, 7.6, 7.8, and 9.3.

## How to verify (exact commands and expected output)
1. Run Playwright customer suite:
   ```powershell
   pnpm exec playwright test tests/e2e/customers.spec.ts
   ```
   Expected: 10 passed across mobile (360px) and desktop (1280px).

2. Run full Playwright test suite:
   ```powershell
   pnpm e2e
   ```
   Expected: 56 passed, 0 failed across all suites.

3. Run Vitest unit test suite:
   ```powershell
   pnpm test
   ```
   Expected: 8 test files, 72 tests passed.

## Known limits
- `pnpm typecheck` currently fails due to BUG-001 in `src/components/screens/CustomerDetailView.tsx` line 224 (owned by UI). Once UI applies the 1-line fix (`entry.runningBalance`), `pnpm typecheck` will be 100% green.

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
