# Handoff p3-ui-to-orch-ledger-flows
Type: DELIVERY
From: UI   To: ORCH   Phase: 3   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 3 Task P3-T3 (Entry Screen, ResultSheet, ReverseSheet, Customer Detail Ledger Pagination):

1. **Entry Screen (`src/components/screens/EntryView.tsx`, `src/app/(app)/entry/page.tsx`)**:
   - Segmented switch: **Udhaar** | **Payment** (selected has `--ink` fill, synchronized with URL query parameter `?type=`).
   - Customer picker: 56px full-width button opening `CustomerPicker` bottom drawer with client-side name/phone search. Pre-selects customer from URL `?customer=<uuid>` and focuses amount input.
   - One-line balance readout under customer button: "Owes ₹X", "Settled", or "Advance ₹X".
   - `AmountField`: 32px bold numeric input with ₹ prefix and quick-add chips (+10, +20, +50, +100, Clear).
   - Note field: input with `NoteChips` (Chai, Cold drink, Cigarette, Paan, General).
   - Sticky footer button (56px full width): "Save udhaar" (`--owed` fill) or "Save payment" (`--paid` fill).
   - Disabled until a customer and amount (> 0) exist. While pending: "Saving…", disabled, double-submit guarded.
   - Advance payment flow: If payment > balance (or RPC returns `ADVANCE_CONFIRMATION_REQUIRED`), opens `ConfirmSheet` with title "Payment is more than the balance.", figures list (Current balance, Payment amount, Advance after), and actions "Save as advance" (submits with `confirmAdvance: true`) and "Change amount".
   - No blocking alert on udhaar for customers past alert step (D-04).
   - Failure: stays on form, retains values, shows `InlineError` above footer button, reuses same idempotencyKey.
   - Success: opens `ResultSheet`. Form resets (clears customer, amount, note, generates fresh `idempotencyKey`) ONLY after `ResultSheet` is dismissed.

2. **Result Bottom Sheet (`src/components/screens/ResultSheet.tsx`)**:
   - Bottom sheet opening after save.
   - Line 1: "₹X udhaar added for <Customer>." or "₹X payment recorded for <Customer>.". If replayed: "This entry was already saved."
   - Line 2: 32px hero balance: "Balance ₹X" with owed/paid/advance cue.
   - Alert block (if `alert` present): On `--alert-wash` background: "<Customer>'s balance crossed ₹X." with "Open WhatsApp reminder" button opening `ReminderSheet`.
   - Actions: "Done" and inline reversal button "Entered by mistake? Reverse it" (expands reason input with label "Reason for reversing" and calls `reverseTransactionAction`).

3. **Reverse Bottom Sheet (`src/components/screens/ReverseSheet.tsx`)**:
   - Opened by tapping any ledger row.
   - Shows full entry details: type, amount, IST date/time, note, running balance after.
   - Reversal form: Reason input (label "Reason for reversing", min 3 max 140 chars) and "Reverse entry" button.
   - Explanatory notices when entry cannot be reversed:
     - If already reversed: "This entry was already reversed." (button hidden).
     - If is a reversal: "Reversal entries cannot be reversed." (button hidden).
   - On success: updates displayed balance and notifies parent view.

4. **Advance Confirmation Extension in `ConfirmSheet.tsx` (`src/components/screens/ConfirmSheet.tsx`)**:
   - Extended to support figures list (`Current balance`, `Payment amount`, `Advance after`) with "Save as advance" and "Change amount" buttons.

5. **Customer Detail Ledger Pagination & Reversal Integration (`src/components/screens/CustomerDetailView.tsx`, `src/app/(app)/customers/[id]/page.tsx`)**:
   - Integrated `LedgerList` with entries grouped by day using `dayLabelIST` and `.khata-margin` double rule.
   - Tapping an entry opens `ReverseSheet`.
   - Cursor-based pagination with `onLoadOlder` server action and "Load older entries" button.
   - On successful reversal, updates local balance and entries list without full page reload.

## Files touched (paths)
- `src/components/screens/EntryView.tsx`
- `src/components/screens/ResultSheet.tsx`
- `src/components/screens/ReverseSheet.tsx`
- `src/components/screens/ConfirmSheet.tsx`
- `src/components/screens/CustomerDetailView.tsx`
- `src/app/(app)/entry/page.tsx`
- `src/app/(app)/customers/[id]/page.tsx`
- `docs/agent-log/handoffs/p3-ui-to-orch-ledger-flows.md`

## Contract impact
None. All components consume strict typed contracts from `src/lib/contracts/transactions.ts`, `src/app/(app)/entry/actions.ts`, and `src/app/(app)/customers/[id]/actions.ts`.

## How to verify
1. Navigate to `/entry`:
   - Toggle segmented switch between Udhaar and Payment.
   - Tap customer picker, search customer, select. Verify one-line balance readout.
   - Enter amount using quick-add chips (+10, +20, +50, +100, Clear).
   - Tap note chip (e.g. Chai).
   - Save udhaar: verify "Saving…" state, then `ResultSheet` opens with correct Line 1, 32px balance hero, and alert block if alert step crossed.
   - Close `ResultSheet`: verify form resets and new idempotencyKey is generated.
2. Advance payment test:
   - Switch to Payment for customer with balance ₹100.
   - Enter ₹200.
   - Tap "Save payment": verify `ConfirmSheet` opens with "Payment is more than the balance." and figures list (Current balance: ₹100, Payment amount: ₹200, Advance after: ₹100).
   - Tap "Save as advance": verify successful save.
3. Reversal test:
   - On `/customers/[id]`, tap any active entry in `LedgerList`.
   - Verify `ReverseSheet` opens with entry details.
   - Enter reason (min 3 chars), tap "Reverse entry".
   - Verify entry is struck through, new balance updated, reversal entry appears in ledger.
   - Tap a reversed entry or reversal: verify reversal button is hidden with explanatory copy.
4. Ledger pagination test:
   - On customer with > 50 entries, scroll down and tap "Load older entries".
   - Verify cursor-based older entries append to the list.

## Known limits
None.

## Blocking question
None.
