# Chai Ledger UI Primitives Documentation

**Owner:** `DSYS` (Design System Engineer)  
**Status:** Phase 1 Complete (Task P1-T3)  
**Reference:** `CHAI_LEDGER_MULTI_AGENT_SPEC.md` (Sections 7.1, 7.2, 7.3, 7.7)

---

## Overview

All primitives in `src/components/ui/` are custom-styled to the Chai Ledger design system tokens. Default shadcn zinc variables, gradients, decorative box shadows, and rounded-card grids have been completely purged. Every interactive element enforces a touch target floor of **at least 48px** (`--tap: 48px`).

---

## 1. Button (`src/components/ui/button.tsx`)

Built with `@radix-ui/react-slot` and `class-variance-authority`.

### Variants
| Variant | Visual Appearance | Intended Usage |
|---|---|---|
| `default` / `primary` | Solid `--ink` (`#17212B`) fill, white text | Standard primary actions (e.g., "Log in", "Add customer") |
| `owed` | Solid `--owed` (`#A3261F`) fill, white text | Udhaar actions (e.g., "Save udhaar", "Add udhaar") |
| `paid` | Solid `--paid` (`#1F6B4A`) fill, white text | Payment actions (e.g., "Save payment", "Add payment") |
| `outline` | 1px `--rule` (`#C9D3DA`) border, transparent bg, `--ink` text | Secondary actions, "Send WhatsApp reminder", "Change amount" |
| `text` / `ghost` | Transparent bg, `--ink` text, hover `--paper` | Text buttons, "Clear", "Entered by mistake? Reverse it" |
| `alert` | `--alert-wash` (`#FBEFD0`) fill, `--alert-ink` text | Notice actions, "Open WhatsApp reminder" on alert |

### Sizes
- `default`: Min height **48px** (`min-h-[48px]`), px-4 py-2.5, radius `--radius-control: 10px`.
- `save`: Height **56px** (`min-h-[56px]`), full width, px-6, text `18px` bold for entry screen primary save buttons.
- `chip`: Height **44px** (`min-h-[44px]`), px-3.5, radius `--radius-chip: 6px` for quick-add chips (`+10`, `+50`).
- `icon`: **48px x 48px** touch target, centered icon.

### Micro-interactions
- Active state: `scale(0.98)` over `100ms ease-out`. Automatically disabled when `prefers-reduced-motion: reduce`.
- Focus ring: `2px solid var(--focus)` with `2px offset`.

---

## 2. Input (`src/components/ui/input.tsx`)

### Rules & Styling
- Background: `--sheet` (`#FFFFFF`).
- Border: `1px solid var(--rule)` (`#C9D3DA`).
- Radius: `--radius-control: 10px`.
- Height: Minimum **48px** (`min-h-[48px]`).
- Typography: Font size **16px** (`text-[16px]`), strictly preventing iOS Safari auto-zoom on focus.
- Focus: `2px solid var(--focus)` with `2px offset`.
- Error state: `error={true}` or `aria-invalid="true"` applies `border-[var(--owed)]` and `ring-[var(--owed)]`.

---

## 3. Label (`src/components/ui/label.tsx`)

Built with `@radix-ui/react-label`.
- Typography: `14px` bold in `--ink-soft` (`#4A5866`).
- Case: Sentence case strictly enforced (e.g., "Mobile number", "Alert step").
- Bound to inputs via `htmlFor`.

---

## 4. Textarea (`src/components/ui/textarea.tsx`)

- Background: `--sheet` (`#FFFFFF`), border `1px solid var(--rule)`.
- Radius: `--radius-control: 10px`.
- Typography: `16px` font size.
- Min height: `96px`.
- Focus ring: `2px solid var(--focus)` with `2px offset`.

---

## 5. Drawer (`src/components/ui/drawer.tsx`)

Built on `vaul` (version 1.1.2) for bottom sheets.

### Rules & Styling
- Radius: Top corners only `--radius-sheet: 20px` (`rounded-t-[20px]`).
- Background: `--sheet` (`#FFFFFF`).
- Shadow: Soft sheet shadow (`shadow-[0_-4px_20px_rgba(23,33,43,0.08)]`). This is the sole allowed shadow in the application.
- Slide animation: `150ms ease-out` translateY. Disabled on reduced motion.
- Overlay: Fixed `bg-[var(--ink)]/40` backdrop. No blur.
- Grab Handle: `36px` x `4px` rounded bar in `--rule`.
- Accessibility: Focus trapped, Escape key closes, accessible ARIA roles.

---

## 6. Dialog (`src/components/ui/dialog.tsx`)

Built with `@radix-ui/react-dialog`.
- Background: `--sheet` (`#FFFFFF`).
- Border: `1px solid var(--rule)`.
- Radius: `--radius-control: 10px`.
- Overlay: `bg-[var(--ink)]/40`.
- Close Button: Minimum `48px` touch target with `20px` Lucide `X` icon.

---

## 7. Command (`src/components/ui/command.tsx`)

Built on `cmdk` (version 1.0.4) for customer search and picker flows.
- Container: `--sheet` background, `1px solid var(--rule)`, radius `--radius-control: 10px`.
- Input: Min height `48px`, font size `16px`, clean border-b `1px solid var(--rule)`.
- Rows: Min height `48px` (`min-h-[48px]`), ruled rows with `1px solid var(--rule)` dividers, selected row highlight `--paper` (`#F1F3EE`).

---

## 8. Select (`src/components/ui/select.tsx`)

Built with `@radix-ui/react-select`.
- Trigger: Min height `48px`, radius `--radius-control: 10px`, border `1px solid var(--rule)`, font size `16px`.
- Content: `--sheet` background, border `1px solid var(--rule)`, soft dropdown shadow.
- Items: Min height `48px`, active highlight `--paper`.

---

## 9. Sonner (`src/components/ui/sonner.tsx`)

Built on `sonner`.
- Restyled with `--sheet` background, `--rule` border, `--radius-control: 10px`.
- **CRITICAL SPEC RULE (Section 7.3 Rule 10):** Must NEVER be used for money transactions or ledger entries. Financial results strictly use `ResultSheet`. Sonner is reserved for non-financial system messages only.

---

## 10. EmptyState (`src/components/ui/empty-state.tsx` & `src/components/screens/EmptyState.tsx`)

Text-only empty state adhering strictly to Section 7.3 (Rule 8: no illustrations, Rule 5: no emoji).
- Props:
  - `title: string` (18px bold `--ink`)
  - `body?: string` (14px `--ink-soft`)
  - `action?: React.ReactNode` (optional action button)

---

## 11. InlineError (`src/components/ui/inline-error.tsx` & `src/components/screens/InlineError.tsx`)

Form validation error display.
- Props:
  - `message?: string | null`
  - `id?: string` (bound via `aria-describedby` on the input)
- Styling: `14px` bold in `--owed` (`#A3261F`), `role="alert"`.

---

## 12. MoneyText (`src/components/ledger/MoneyText.tsx`)

Currency display component enforcing formatting and tabular alignment.
- Props:
  - `value: string`: Raw numerical string (e.g., `"50.00"`, `"1250.50"`, `"-200.00"`).
  - `tone?: "owed" | "paid" | "plain"`: Applies semantic color (`--owed`, `--paid`, or `--ink`).
  - `size?: "meta" | "body" | "figure"`: 14px, 16px, or 32px bold hero amount.
- Uses `formatINR` from `src/lib/money.ts` and enforces `tabular-nums`.

---

## 13. BalanceLine (`src/components/ledger/BalanceLine.tsx`)

Customer status and balance display ensuring explicit word cues (never color alone per Section 7.2).
- Props:
  - `status: CustomerStatus` (`"OWING" | "ALERT" | "CLEAR" | "ADVANCE"`)
  - `balance: string`
  - `alertStep: string`
  - `alertLevel: number`
  - `isActive?: boolean`
  - `compact?: boolean`
- Status variants:
  - `OWING`: "Owes ₹X" in `--owed`.
  - `ALERT`: "Owes ₹X" in `--owed` plus "Crossed ₹X" badge on `--alert-wash` with `--alert-ink` text.
  - `CLEAR`: "Settled" in `--ink-soft`.
  - `ADVANCE`: "Advance ₹X" in `--paid`.
  - Inactive note: If `isActive === false`, displays "Inactive. New udhaar is blocked." in `--ink-soft`.

---

## 14. CustomerPicker (`src/components/ledger/CustomerPicker.tsx`)

Customer selection bottom sheet built on `Drawer` (`vaul`).
- Props:
  - `customers: CustomerBalance[]`
  - `mode: "udhaar" | "payment"`
  - `value?: string`
  - `onChange: (customer: CustomerBalance) => void`
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
- Filtering rules (Section 7.6.2):
  - `mode === "udhaar"`: Inactive customers are hidden (`isActive === true`).
  - `mode === "payment"`: Inactive customers are shown only if `balance !== 0`.
- Client-side search: Matches customer name or normalized phone digits.
- Rows: Min height 48px, ruled row dividers, formatted phone (`+91 98765 43210`), and `BalanceLine`.

---

## 15. LedgerList (`src/components/ledger/LedgerList.tsx`)

Khata customer ledger list with day grouping and traditional red margin rule.
- Props:
  - `entries: LedgerEntry[]`
  - `onSelectEntry?: (entry: LedgerEntry) => void`
  - `onLoadOlder?: () => void`
  - `hasMore?: boolean`
  - `isLoadingOlder?: boolean`
- Visual Features:
  - Day grouping via `dayLabelIST` ("Today", "Yesterday", "4 Nov") with distinct `--paper` header rows.
  - `.khata-margin`: Traditional physical khata double red vertical margin rule (two 1px lines of `--rule-margin`, 3px apart, 12px from edge).
  - Responsive: Mobile ruled rows with `.khata-margin`; Desktop 5-column table (Date & Time, Note, Udhaar, Paid, Balance).
  - "Load older entries" pagination button.

---

## 16. LedgerRow (`src/components/ledger/LedgerRow.tsx`)

Individual ledger row component.
- Props:
  - `entry: LedgerEntry`
  - `compact?: boolean` (shows customer name for dashboard recent entries)
  - `onSelect?: (entry: LedgerEntry) => void`
- Visual Features:
  - Left column: Time in IST (`formatIST(entry.createdAt, "time")`), note / description (or "Reversal: <reason>").
  - Reversed original entries: Amount line struck through (`line-through text-[var(--ink-soft)]`), and label "Reversed" displayed beneath note.
  - Right column: "Udhaar ₹X" in `--owed` or "Paid ₹X" in `--paid`, plus running balance beneath in 14px `--ink-soft`.
  - Advance entries: "Advance" badge under amount.
  - Minimum 48px touch target with active press feedback.

---

## 17. AmountField (`src/components/ledger/AmountField.tsx`)

High-visibility currency input with quick-add chips.
- Props:
  - `value: string`
  - `onChange: (val: string) => void`
  - `error?: string | null`
  - `disabled?: boolean`
  - `id?: string`
- Visual Features:
  - Hero 32px bold text, `inputmode="decimal"`, prefixed by `₹`, `tabular-nums`.
  - Strict input sanitization: Numbers only, at most one dot, max 2 decimals, capped at ₹1,00,000.
  - Quick-add chips (`+10`, `+20`, `+50`, `+100`): 44px tall, radius `--radius-chip: 6px`.
  - `Clear` button to reset value.
  - Displays inline validation error if `error` prop is set.

---

## 18. NoteChips (`src/components/ledger/NoteChips.tsx`)

Quick transaction note selector.
- Props:
  - `value: string`
  - `onChange: (val: string) => void`
  - `disabled?: boolean`
  - `chips?: readonly string[]` (defaults to `["Chai", "Cold drink", "Cigarette", "Paan", "General"]`)
- Visual Features:
  - 44px height chips with `--radius-chip: 6px`.
  - Active chip has `--ink` fill with white text; tapping the active chip clears the note.
  - Tapping an inactive chip sets the note to that text.


