# Handoff p5-qa-to-orch-hardening-and-design-gate
Type: DELIVERY
From: QA   To: ORCH   Phase: 5   Date: 2026-11-04

## What is delivered or needed
Completed tasks P5-T2 (Responsive, Zoom & Keyboard Regression), P5-T3 (12-Point Design Gate Review Audit), and P5-T5 (Security Review):

1. **P5-T2: Responsive, Zoom & Keyboard Regression (E2E-15, E2E-16)**:
   - Created `tests/e2e/responsive-accessibility.spec.ts` covering:
     - Viewports: 320px (iPhone SE 1st gen), 360px (Mid Android), 412px (Pixel), 768px (Tablet), 1280px (Desktop) across all 5 key routes (`/`, `/customers`, `/entry?type=udhaar`, `/settings`, `/customers/[id]`).
     - 200% zoom emulation testing zero horizontal overflow.
     - Focus ring visibility on focused controls (`outline: 2px solid var(--focus)`).
     - Keyboard-only completion of an udhaar entry (Tab, customer selection, typing 50, Enter on Save udhaar, ResultSheet display and dismissal).
     - Captured design gate screenshots saved to `tests/visual/` (`dashboard-320px.png`, `dashboard-360px.png`, `dashboard-1280px.png`, `entry-360px.png`, `customer-detail-360px.png`, `customer-detail-1280px.png`, `settings-360px.png`).
   - Results: 320px, 360px, 412px, 1280px, and 200% zoom passed with zero horizontal scroll. 768px tablet viewport failed due to sidebar + 2-column dashboard grid overflow, tracked as S2 bug `BUG-003`.

2. **P5-T3: 12-Point Design Gate Review Audit**:
   - Completed full audit documented in `docs/design/review-checklist.md`:
     1. Palette audit: All colors map strictly to Section 7.2 tokens. Zero untokenized hex colors.
     2. Radius audit: Restricted strictly to `--radius-chip` (6px), `--radius-control` (10px), `--radius-sheet` (20px). Ledger rows and tables have zero radius.
     3. Typography audit: Single font family Atkinson Hyperlegible. Tabular numbers (`tabular-nums`) enforced on every money readout. Zero monospace faces.
     4. Scale audit: Strict compliance with font scale (14, 16, 18, 22, 32).
     5. Ruled ledger audit: Verified `.khata-margin` (double red vertical margin rule) and hairline row dividers.
     6. Touch target audit: Minimum 48px on all interactive controls.
     7. Motion audit: Restricted to sheet slide (150ms) and button press scale (0.98). Respects `prefers-reduced-motion`.
     8. Copy audit: Sentence case throughout. Zero generic copy ("Oops", "Welcome back", "Submit"). Section 7.8 microcopy exact match. WhatsApp invariant preserved (never says "sent").
     9. Banned patterns audit: All 12 banned patterns in Section 7.3 verified clean (0 occurrences).
     10. Responsive audit: 320px, 360px, 412px, 1280px pass. 768px tablet overflow tracked in `BUG-003`.
     11. Accessibility audit: Contrast ratios between 5.93:1 and 16.29:1 (exceeding 4.5:1 WCAG AA). Visible focus rings and aria attributes verified.
     12. Performance audit: Timed mobile fast entry run completed in ~3.2s (well under <= 15s requirement).

3. **P5-T5: Security Review Checklist (Signed)**:
   - [x] Zero service-role keys in repo (`grep -R "service_role" src` returns nothing).
   - [x] Zero fixture references in source (`grep -R "CHAI_FIXTURES\|fixtures" src` returns nothing).
   - [x] Zero direct client writes to `transactions` table. All mutations execute atomic PostgreSQL RPCs (`create_transaction`, `reverse_transaction`). Direct inserts, updates, deletes blocked.
   - [x] Server-side ownership checks enforced on all server actions and readers using `safeRequireUser()` / `requireUser()` with session `user.id`.
   - [x] Section 6.6 HTTP security headers present in `next.config.ts`:
     - `X-Frame-Options: DENY`
     - `X-Content-Type-Options: nosniff`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

4. **Bugs Filed**:
   - `docs/agent-log/bugs/BUG-003-768px-horizontal-overflow.md` (Severity: S2, Owner: UI).

## Files touched (paths)
- `tests/e2e/responsive-accessibility.spec.ts` (created)
- `docs/design/review-checklist.md` (created)
- `docs/agent-log/bugs/BUG-003-768px-horizontal-overflow.md` (created)
- `docs/agent-log/handoffs/p5-qa-to-orch-hardening-and-design-gate.md` (created)

## Contract impact
None. No API or data contracts were changed.

## How to verify
1. Run Unit test suite:
   ```bash
   pnpm test
   ```
   Expected output: 12 test files passed, 120 tests passed.
2. Run Responsive & Accessibility Playwright suite:
   ```bash
   pnpm exec playwright test tests/e2e/responsive-accessibility.spec.ts --project=desktop
   ```
   Expected output: Viewports 320px, 360px, 412px, 1280px pass; 768px triggers soft assertion for BUG-003.

## Known limits
- Horizontal overflow at 768px on `/` (scrollWidth 885px) and `/customers/[id]` (scrollWidth 771px) awaiting UI layout adjustment from `md:flex-row` to `lg:flex-row` (tracked in `BUG-003`).

## Blocking question
None.
