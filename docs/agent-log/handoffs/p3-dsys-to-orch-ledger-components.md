# Handoff p3-dsys-to-orch-ledger-components
Type: DELIVERY
From: DSYS   To: ORCH   Phase: 3   Date: 2026-11-04

## What is delivered or needed
Completed Phase 3 Task P3-T2 (Shared Ledger Components: LedgerList, LedgerRow, AmountField, NoteChips):

1. **`LedgerList` (`src/components/ledger/LedgerList.tsx`)**:
   - Day grouping via `dayLabelIST` ("Today", "Yesterday", "4 Nov") with clean `--paper` section headers.
   - White sheet container styled with `.khata-margin` (physical khata double vertical red margin rule: two 1px lines of `--rule-margin`, 3px apart, 12px from edge).
   - Hairline dividers between consecutive entries.
   - Desktop responsive variant: 5-column table (Date & Time, Note, Udhaar, Paid, Balance) with right-aligned money values.
   - Integrated pagination button: "Load older entries".
   - Props: `entries: LedgerEntry[]; onSelectEntry?: (entry: LedgerEntry) => void; onLoadOlder?: () => void; hasMore?: boolean; isLoadingOlder?: boolean`.

2. **`LedgerRow` (`src/components/ledger/LedgerRow.tsx`)**:
   - Left column: Time in IST (`formatIST(entry.createdAt, "time")`), note/description (or "Reversal: <reason>").
   - Reversed original entries: Amount line struck through (`line-through text-[var(--ink-soft)]`), and label "Reversed" displayed beneath note.
   - Right column: "Udhaar ₹X" in `--owed` or "Paid ₹X" in `--paid`, plus running balance beneath in 14px `--ink-soft` ("Balance ₹1,150").
   - Advance payments show "Advance" label under amount.
   - `compact` mode for dashboard recent entries: displays customer name.
   - Minimum 48px touch target with active press feedback.

3. **`AmountField` (`src/components/ledger/AmountField.tsx`)**:
   - 32px bold amount input with `inputmode="decimal"`, prefixed by `₹`, tabular numbers.
   - Sanitization: Allows only digits and at most one dot with up to 2 decimal places. Capped at ₹1,00,000.
   - Quick-add chips (`+10`, `+20`, `+50`, `+100`): adds integer to current paise value without float arithmetic.
   - `Clear` button to reset amount.
   - Chips: 44px tall, radius `--radius-chip: 6px`.

4. **`NoteChips` (`src/components/ledger/NoteChips.tsx`)**:
   - Quick transaction note chips: `Chai`, `Cold drink`, `Cigarette`, `Paan`, `General`.
   - Tapping an inactive chip sets the note; tapping the active chip clears it.
   - Chips: 44px tall, radius `--radius-chip: 6px`. Active state styled with `--ink` fill and white text.

5. **Design Documentation (`docs/design/components.md`)**:
   - Added sections 15, 16, 17, and 18 covering `LedgerList`, `LedgerRow`, `AmountField`, and `NoteChips`.

## Files touched (paths)
- `src/components/ledger/LedgerList.tsx`
- `src/components/ledger/LedgerRow.tsx`
- `src/components/ledger/AmountField.tsx`
- `src/components/ledger/NoteChips.tsx`
- `docs/design/components.md`
- `docs/agent-log/handoffs/p3-dsys-to-orch-ledger-components.md`

## Contract impact
None. Components adhere strictly to existing contracts in `src/lib/contracts/transactions.ts`.

## How to verify (exact commands and expected output)
1. Run TypeScript check:
   ```powershell
   pnpm typecheck
   ```
   Expected output: `tsc --noEmit` exits with code 0 (zero errors).

2. Run ESLint:
   ```powershell
   pnpm lint
   ```
   Expected output: `✔ No ESLint warnings or errors`.

3. Visual and functional verification:
   Verify `LedgerList` renders `.khata-margin` double rule and day grouping, `LedgerRow` displays reversed states properly, `AmountField` sanitizes input up to ₹1,00,000, and `NoteChips` toggles active selection.

## Known limits
- Ready for composition by `UI` in Phase 3 Task P3-T3 (Entry screen, customer detail ledger, and sheets).

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
