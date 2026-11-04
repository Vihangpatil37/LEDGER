# Handoff p2-dsys-to-orch-customer-components
Type: DELIVERY
From: DSYS   To: ORCH   Phase: 2   Date: 2026-11-04

## What is delivered or needed
Completed Phase 2 Task P2-T3 (Customer components: MoneyText, BalanceLine, CustomerPicker):

1. **`MoneyText` (`src/components/ledger/MoneyText.tsx`)**:
   - Currency display component with props: `value: string; tone?: "owed" | "paid" | "plain"; size?: "meta" | "body" | "figure"; className?: string; as?: React.ElementType`.
   - Uses `formatINR` from `src/lib/money.ts`.
   - Enforces `tabular-nums` and `data-money` attribute.
   - Applies tone colors: `owed` -> `text-[var(--owed)]`, `paid` -> `text-[var(--paid)]`, `plain` -> `text-[var(--ink)]`.
   - Size scale: `meta` (14px), `body` (16px), `figure` (32px bold).

2. **`BalanceLine` (`src/components/ledger/BalanceLine.tsx`)**:
   - Status & balance readout with props: `status: CustomerStatus; balance: string; alertStep: string; alertLevel: number; isActive?: boolean; className?: string; compact?: boolean`.
   - Implements required status variants with word cues (never color alone per Section 7.2):
     - `OWING`: "Owes ₹X" in `--owed`.
     - `ALERT`: "Owes ₹X" in `--owed` AND "Crossed ₹X" badge on `--alert-wash` in `--alert-ink`.
     - `CLEAR`: "Settled" in `--ink-soft`.
     - `ADVANCE`: "Advance ₹X" in `--paid`.
     - Inactive note: If `isActive === false`, displays "Inactive. New udhaar is blocked." in `--ink-soft`.

3. **`CustomerPicker` (`src/components/ledger/CustomerPicker.tsx`)**:
   - Customer picker bottom sheet built on Vaul `Drawer`.
   - Props: `customers: CustomerBalance[]; mode: "udhaar" | "payment"; value?: string; onChange: (customer: CustomerBalance) => void; open: boolean; onOpenChange: (open: boolean) => void; className?: string`.
   - Enforces business rules per Section 7.6.2:
     - `mode === "udhaar"`: Inactive customers are hidden (`isActive === true`).
     - `mode === "payment"`: Inactive customers are shown ONLY if balance is not zero.
   - Client-side search filters by customer name (case-insensitive) or phone digits.
   - Minimum 48px touch targets per item, ruled lines between items, formatted phone display (`+91 98765 43210`), and `BalanceLine`.

4. **Documentation**:
   - Updated `docs/design/components.md` with sections 12, 13, and 14 for `MoneyText`, `BalanceLine`, and `CustomerPicker`.

## Files touched (paths)
- `src/components/ledger/MoneyText.tsx`
- `src/components/ledger/BalanceLine.tsx`
- `src/components/ledger/CustomerPicker.tsx`
- `docs/design/components.md`
- `docs/agent-log/handoffs/p2-dsys-to-orch-customer-components.md`

## Contract impact
None. Implements frontend components against existing contracts in `src/lib/contracts/customers.ts`.

## How to verify (exact commands and expected output)
1. Run TypeScript check:
   ```powershell
   pnpm typecheck
   ```
   Expected output: `tsc --noEmit` exits with 0 errors.

2. Run ESLint:
   ```powershell
   pnpm lint
   ```
   Expected output: `✔ No ESLint warnings or errors`.

3. Component integration verification:
   Verify `MoneyText`, `BalanceLine`, and `CustomerPicker` import cleanly and adhere to all props and filtering logic.

## Known limits
- Ready for UI screens composition in P2-T2 (`CustomerListView`, `CustomerDetailView`, entry screen picker).

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
