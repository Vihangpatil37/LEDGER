# BUG-003: Horizontal overflow at 768px tablet viewport on Dashboard and Customer Ledger
Severity: S2     Found by: QA     Owner: UI     Status: closed
Fix notes (owner):
- In `src/components/screens/DashboardView.tsx`: changed `md:flex-row` to `lg:flex-row` and `md:w-[320px]` to `lg:w-[320px]`. Tablet 768px viewports now stack cleanly while desktop 1024px+ viewports retain side-by-side columns.
- In `src/components/ledger/LedgerList.tsx`: added `overflow-x-auto` to the desktop table container.
- Verified with `tests/e2e/responsive-accessibility.spec.ts` across 320, 360, 412, 768, 1280px viewports (all 16 tests passed with zero overflow).
Regression test added:
`tests/e2e/responsive-accessibility.spec.ts` (E2E-15 suite)
Loop count: 1 of 3 (resolved on first loop)
