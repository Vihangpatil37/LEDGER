# Handoff p1-api-to-orch-auth
Type: DELIVERY
From: API   To: ORCH   Phase: 1   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 1 Task P1-T2 (Supabase Clients, Real Auth, Server Action Authentication, and Middleware):

1. **Supabase Clients**:
   - `src/lib/supabase/server.ts`: Server client via `@supabase/ssr` `createServerClient` reading/writing cookies from `next/headers`.
   - `src/lib/supabase/client.ts`: Browser client via `@supabase/ssr` `createBrowserClient`.
   - `src/lib/supabase/middleware.ts`: Session update helper using `@supabase/ssr` with mandatory `supabase.auth.getUser()` verification.

2. **Server Auth & Error Handling**:
   - `src/lib/server/auth.ts`: `requireUser()` and `safeRequireUser()` calling `supabase.auth.getUser()`. Throws or returns `UNAUTHENTICATED`.
   - `src/lib/server/errors.ts`: Maps PostgREST/RPC error messages to `AppErrorCode` (with JSON details parsing) and maps unknown errors to `INTERNAL` (logging server-side with sensitive information redacted).
   - `src/lib/server/mappers.ts`: Maps DB views and RPC responses to strict typed contracts with amounts formatted to two-decimal strings (`n.toFixed(2)`).

3. **Next.js Middleware**:
   - `src/middleware.ts`: Refreshes Supabase session; redirects unauthenticated requests on protected routes to `/login?next=<encoded_path>`; redirects authenticated users visiting `/login` to `/`.

4. **Auth Server Actions & Route Handler**:
   - `src/app/(auth)/login/actions.ts`: `loginAction` (Zod validated, `signInWithPassword`, returns sanitized same-origin `redirectTo`), `logoutAction` (`signOut` and redirect `/login`).
   - `src/app/(auth)/forgot-password/actions.ts`: `requestPasswordResetAction` (`resetPasswordForEmail` with redirect to `/auth/confirm?next=/reset-password`, always returns success `{}` to prevent user enumeration).
   - `src/app/(auth)/reset-password/actions.ts`: `updatePasswordAction` (requires authenticated session, validates min 8 max 72 characters, `updateUser`).
   - `src/app/auth/confirm/route.ts`: Route handler for OTP token hash verification via `supabase.auth.verifyOtp` and redirection to destination.
   - `src/app/actions.ts`: Re-exports auth actions.

5. **Unit Tests**:
   - `tests/unit/mappers.test.ts`: Tests `formatAmount`, `mapCustomerBalance`, `mapLedgerEntry`.
   - `tests/unit/errors.test.ts`: Tests error mapping, `AppAuthError`, JSON details parsing, and `INTERNAL` fallback.

## Files touched (paths)
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/server/auth.ts`
- `src/lib/server/errors.ts`
- `src/lib/server/mappers.ts`
- `src/middleware.ts`
- `src/app/(auth)/login/actions.ts`
- `src/app/(auth)/forgot-password/actions.ts`
- `src/app/(auth)/reset-password/actions.ts`
- `src/app/auth/confirm/route.ts`
- `src/app/actions.ts`
- `tests/unit/mappers.test.ts`
- `tests/unit/errors.test.ts`

## Contract impact
None. All implementations conform to the locked contracts in Section 6.

## How to verify
1. Run `pnpm typecheck` (`tsc --noEmit`): Compiles cleanly without type errors.
2. Run `pnpm test` (`vitest run`): All unit tests pass across pure libraries, error handlers, and mappers.

## Known limits
- Public signup is disabled per D-10. Owner user must exist in Supabase auth.
- Production environment requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`.

## Blocking question
None.
