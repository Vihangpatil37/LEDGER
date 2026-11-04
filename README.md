# Chai Ledger

A small ledger app for tracking customers, entries and balances — built with Next.js 15, React 19, TypeScript and Supabase.

## Getting started

```bash
pnpm install
pnpm dev
```

The dev server runs on <http://localhost:3000>.

## Scripts

| command | what it does |
| --- | --- |
| `pnpm dev` | start the dev server |
| `pnpm build` | production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | eslint via next |
| `pnpm test` | vitest unit tests |
| `pnpm test:db` | pgTAP tests against supabase |
| `pnpm e2e` | playwright end-to-end tests |

## Layout

```
src/
  app/           routes, pages and server actions
  components/
    ledger/      money display, ledger rows, pickers
    screens/     shell, nav, views and sheets
    ui/          base primitives
  lib/
    contracts/   shared zod schemas
    server/      queries, mappers, auth
    supabase/    client setup
supabase/
  migrations/    schema, rls, views, rpc, grants
tests/
  unit/          vitest
  e2e/           playwright
  visual/        screenshot baselines
docs/
  design/        tokens, component notes, checklist
  agent-log/     build notes, bugs, handoffs
```

## Environment

`.env` is git-ignored. It expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
