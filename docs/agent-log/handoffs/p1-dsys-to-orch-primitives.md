# Handoff p1-dsys-to-orch-primitives
Type: DELIVERY
From: DSYS   To: ORCH   Phase: 1   Date: 2026-11-04

## What is delivered or needed
Completed Phase 1 Task P1-T3 (Restyled shadcn Primitives and Base Components):

1. **Button (`src/components/ui/button.tsx`)**:
   - Custom variants styled with Chai Ledger tokens: `default`/`primary` (`--ink`), `owed` (`--owed`), `paid` (`--paid`), `outline` (1px `--rule`), `text`/`ghost` (borderless), `alert` (`--alert-wash` / `--alert-ink`).
   - Sizes: `default` (min 48px), `save` (56px tall for entry save), `chip` (44px tall for quick-add chips), `sm` (48px min tap), `icon` (48px x 48px).
   - Press feedback: `active:scale-[0.98]` over 100ms ease-out; respects `prefers-reduced-motion`.

2. **Input (`src/components/ui/input.tsx`)**:
   - Styled with `--sheet` background, 1px `--rule` border, radius `--radius-control: 10px`, min height `--tap: 48px`, font size `16px` (prevents iOS auto-zoom on focus).
   - Focus ring: 2px `--focus` with 2px offset.
   - Error state: `error` prop / `aria-invalid="true"` sets `--owed` border and ring.

3. **Label (`src/components/ui/label.tsx`)**:
   - Built with `@radix-ui/react-label`.
   - Styled with 14px bold `--ink-soft` text, sentence case.

4. **Textarea (`src/components/ui/textarea.tsx`)**:
   - Styled with `--sheet` background, 1px `--rule` border, radius `--radius-control: 10px`, font size `16px`, focus ring 2px `--focus`.

5. **Drawer (`src/components/ui/drawer.tsx`)**:
   - Built on `vaul` (version 1.1.2).
   - Top corners `--radius-sheet: 20px`, `--sheet` background, soft shadow (`--sheet-shadow`), slide animation 150ms ease-out.
   - Clean dim overlay `bg-[var(--ink)]/40` (no blur), grab bar handle, focus trapped, Escape closes.

6. **Dialog (`src/components/ui/dialog.tsx`)**:
   - Built on `@radix-ui/react-dialog`.
   - Modal with `--sheet` background, `--radius-control: 10px`, `--ink` text, 48px close button with 20px Lucide `X` icon.

7. **Command (`src/components/ui/command.tsx`)**:
   - Built on `cmdk` (version 1.0.4).
   - Purged default zinc background; styled with `--sheet` background, `--rule` hairlines, `--paper` hover/selection, 48px touch rows.

8. **Select (`src/components/ui/select.tsx`)**:
   - Built on `@radix-ui/react-select`.
   - Trigger min height 48px, `--sheet` bg, 1px `--rule` border, `--radius-control: 10px`, 48px items with `--paper` highlighted background.

9. **Sonner (`src/components/ui/sonner.tsx`)**:
   - Built on `sonner` (version 2.0.1).
   - Styled with `--sheet`, `--ink`, `--rule`. Spec warning documented: never used for financial transactions (strictly ResultSheet).

10. **EmptyState (`src/components/ui/empty-state.tsx` & `src/components/screens/EmptyState.tsx`)**:
    - Props: `title: string; body?: string; action?: React.ReactNode`.
    - Text-only design: strictly no illustration, no decorative icons, no emoji (per Section 7.3 Rule 5 and Rule 8).

11. **InlineError (`src/components/ui/inline-error.tsx` & `src/components/screens/InlineError.tsx`)**:
    - Props: `message?: string | null; id?: string`.
    - Linked to form fields via `aria-describedby`, `role="alert"`, 14px `--owed` text.

12. **Documentation (`docs/design/components.md`)**:
    - Comprehensive guide to each primitive, variants, touch target compliance, and accessibility attributes.

## Files touched (paths)
- `src/components/ui/utils.ts`
- `src/lib/utils.ts`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/screens/EmptyState.tsx`
- `src/components/ui/inline-error.tsx`
- `src/components/screens/InlineError.tsx`
- `docs/design/components.md`
- `docs/agent-log/handoffs/p1-dsys-to-orch-primitives.md`

## Contract impact
None. No API contracts or database schemas modified.

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

3. Verify touch target compliance:
   Check `min-h-[48px]` or `min-h-[56px]` on all primary interactive elements (`Button`, `Input`, `SelectTrigger`, `CommandItem`).

## Known limits
- Primitives are ready for composition by `UI` in task P1-T4 (AppShell, Navigation, Screens).
- Sonner toaster is installed and styled, but barred from financial results per Section 7.3 rule 10.

## Blocking question (QUESTION only) and the default I will use if unanswered
None.
