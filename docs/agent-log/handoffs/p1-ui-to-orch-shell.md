# Handoff p1-ui-to-orch-shell
Type: DELIVERY
From: UI   To: ORCH   Phase: 1   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 1 Task P1-T4 (AppShell, Navigation, Auth Screens, Loading & Error Pages):

1. **Responsive Application Shell (`src/components/screens/AppShell.tsx`)**:
   - Mobile (< 768px): Mobile top header with "Chai Ledger" wordmark (plain text, NO logo); fixed bottom navigation (64px high) with bottom padding (`pb-24`) so content is never obscured.
   - Desktop (>= 768px): Fixed left sidebar (240px wide) on `--paper` with `--rule` right border; content left-aligned with `max-w-[960px]` per Section 7.4.

2. **Mobile Bottom Navigation (`src/components/screens/BottomNav.tsx`)**:
   - 64px fixed bottom bar with 5 items: Home, Customers, Udhaar, Payment, More.
   - "Udhaar" button: filled `--owed` with white text.
   - "Payment" button: filled `--paid` with white text.
   - "Home" and "Customers": text and icon in `--ink` (Lucide 20px, stroke 1.75).
   - "More": text and icon in `--ink`, triggers an accessible bottom sheet (`Drawer`) containing Settings and Log out links with ruled row separators.
   - Active route indicated by a 2px `--ink` top rule on the item + bold label.
   - Touch targets satisfy `>= 48px` minimum.

3. **Desktop Side Navigation (`src/components/screens/SideNav.tsx`)**:
   - Fixed 240px sidebar on `--paper` with `--rule` right border.
   - Wordmark "Chai Ledger" in 18px bold (plain text, NO logo).
   - Quiet, clean, left-aligned nav links: Dashboard, Customers, Add udhaar, Add payment, Settings, Log out.
   - Active route indicated with bold text, `--ink` text color, and a 2px left border on `--sheet`.
   - Log out button calls `logoutAction` with loading state.

4. **Layouts**:
   - `src/app/(app)/layout.tsx`: Authenticated app layout embedding `AppShell`.
   - `src/app/(auth)/layout.tsx`: Centered khata page container on `--paper` with a bordered ledger sheet (`max-w-[420px]`) and plain text "Chai Ledger" wordmark.

5. **Authentication Screens**:
   - `src/app/(auth)/login/page.tsx`: Email and password fields, "Log in" button (primary `--ink`, 48px height), "Forgot password" link. NO signup link per D-10. Error message uses Section 7.8 verbatim: "Email or password is wrong." with `role="alert"`. Handles `next` redirect query param.
   - `src/app/(auth)/forgot-password/page.tsx`: Request reset form calling `requestPasswordResetAction`. Anti-enumeration: always shows copy verbatim from Section 7.5 & 7.8: "If that email has an account, a reset link is on its way." Link back to Log in.
   - `src/app/(auth)/reset-password/page.tsx`: Set new password form with two fields (Password, Confirm password), client-side validation enforcing min 8 characters, calling `updatePasswordAction`. Link back to Log in.

6. **System Screens & Dashboard Placeholder**:
   - `src/app/(app)/loading.tsx`: Skeleton made of ruled rows (`.ruled-row`), static placeholder blocks. Strictly NO shimmer animation and NO pulse per Section 7.5.
   - `src/app/(app)/error.tsx`: Client error boundary showing verbatim Section 7.8 copy: "This page could not load. Check your connection and reload." with Reload button.
   - `src/app/(app)/not-found.tsx`: Not found boundary showing verbatim Section 7.8 copy: "This customer does not exist or is not yours." with link to Customers.
   - `src/components/screens/DashboardView.tsx` & `src/app/(app)/page.tsx`: Composed dashboard screen matching Section 7.6.1 layout (two 56px action buttons for udhaar and payment, "Needs a reminder" alert list with "No customer has crossed their alert step." empty state, ruled definition lists for Today and All customers with Advance held hidden when 0, recent entries with "No entries yet." empty state, desktop two-column layout).

7. **Next.js 15 Server Action Re-export Fix**:
   - In `src/app/actions.ts`: Wrapped auth re-exports into async functions to comply with Next.js 15 SWC rule that only async functions can be exported from `"use server"` modules.

## Files touched (paths)
- `src/components/screens/AppShell.tsx`
- `src/components/screens/BottomNav.tsx`
- `src/components/screens/SideNav.tsx`
- `src/components/screens/DashboardView.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/page.tsx`
- `src/app/(app)/loading.tsx`
- `src/app/(app)/error.tsx`
- `src/app/(app)/not-found.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/actions.ts`
- `docs/agent-log/handoffs/p1-ui-to-orch-shell.md`

## Contract impact
None. All components adhere strictly to Section 6 contracts and Section 7 design system rules.

## How to verify
1. Run `pnpm typecheck`:
   - Passes with 0 errors (`tsc --noEmit`).
2. Run `pnpm lint`:
   - Passes with 0 errors (`next lint`).
3. Run `pnpm test`:
   - All 59 unit tests pass.
4. Run `pnpm build`:
   - All routes compile successfully (`/`, `/login`, `/forgot-password`, `/reset-password`, `/_not-found`).

## Known limits
- Real Supabase auth sessions require environment variables in non-mocked environment.
- WhatsApp reminder trigger in dashboard is an outline action that opens customer details / reminder sheet.

## Blocking question
None.
