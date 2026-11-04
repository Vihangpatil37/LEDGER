# Chai Ledger: Multi-Agent Build Specification (Backend + Frontend)

**Audience:** a team of AI coding agents (Google Antigravity or similar) building Chai Ledger end to end.
**Owner of this document:** the Orchestrator agent (`ORCH`). No other agent edits it.
**Status:** requirements locked. Every decision below is final unless listed in section 11.

Authority order when two statements conflict: (1) Section 1 decisions, (2) Sections 5 and 6 contracts, (3) the rest of this file, (4) agent judgment. If still unclear, the agent stops and files a `QUESTION` handoff to `ORCH`. Agents never guess silently.

---

## 1. Product contract (locked decisions)

Chai Ledger is a single-owner Udhaar (customer credit) web app for one tea stall. Speed, accurate records and phone usability come first. It is not a POS, inventory or accounting system.

| ID | Decision |
|----|----------|
| D-01 | Udhaar entry is **Quick Entry**: customer, amount, optional note. No item catalogue. |
| D-02 | WhatsApp reminders can be generated for **any customer at any time**, plus automatic on-screen alerts when an alert step is crossed. |
| D-03 | Wrong transactions are fixed only by a **reversal entry linked to the original**. No edit, no delete, ever. |
| D-04 | There is **no hard credit limit**. Each customer has an editable **alert step** (`alert_step`, default 500, must be greater than 0). Customers can always take credit (except inactive ones). |
| D-05 | An **alert fires once each time a CREDIT entry makes the balance cross a new multiple of the customer's alert step** (500, 1000, 1500 with step 500). Payments and reversals never fire alerts. |
| D-06 | Transaction time is always the **time of saving**. No backdating. |
| D-07 | Inactive customers keep their history. Their balance **still counts** in dashboard totals. **New credit is blocked.** Payments and reversals are allowed. |
| D-08 | A payment larger than the balance is allowed only after explicit owner confirmation and is shown as **Advance**. |
| D-09 | Duplicate phone number is a **warning only**. The owner may proceed. Records are never merged. |
| D-10 | **Public signup is disabled.** Exactly one owner account exists, created manually. |
| D-11 | WhatsApp uses Click to Chat (`wa.me`). **The owner always presses Send.** The app never claims a message was sent. |
| D-12 | Stack: Next.js (App Router) + TypeScript strict + Tailwind CSS + shadcn/ui primitives + Supabase (Postgres, Auth, RLS) + Vercel. No Express backend. |
| D-13 | All displayed dates and "today" calculations use **India Standard Time (Asia/Kolkata)**. |
| D-14 | Money is `NUMERIC(12,2)` in the database and **strings** at every API boundary. Never floating-point. |

Out of scope: inventory, item-wise billing, GST, automatic WhatsApp or Business API, customer login, staff accounts, multi-shop, analytics beyond the dashboard, native app, PWA, dark mode, payment gateway, notification automation.

Reminder message default (Hinglish, editable in Settings):

```
Namaste {name} ji! 🙏

Aapke account mein ₹{amount} ka udhaar pending hai.

Kripya apna pending payment clear kar dein.

Dhanyavaad!
```

---

## 2. Agent roster

Seven agents. Each has exclusive write ownership of its paths (section 3.1). Reading anything is allowed.

| Agent | Mission | Produces |
|-------|---------|----------|
| `ORCH` Orchestrator | Owns the plan, phase gates, conflict resolution, scope control. Never writes product code. | `docs/agent-log/STATE.md`, phase approvals, fix-request routing |
| `DB` Database and Security | Schema, constraints, RLS, RPC functions, views, pgTAP tests. | `supabase/**` |
| `API` Domain and Server Actions | Typed contracts, pure libraries (money, phone, IST, WhatsApp), server actions, data readers, Supabase clients, auth middleware. | `src/lib/**`, `src/middleware.ts`, `src/app/**/actions.ts` |
| `DSYS` Design System | Tokens, fonts, primitives restyled from shadcn, shared components, design rules. | `src/styles/**`, `src/components/ui/**`, `src/components/ledger/**`, `docs/design/**` |
| `UI` Screens and Flows | Routes, screen composition, forms, flows, copy, states. | `src/app/**` (except actions and route handlers), `src/components/screens/**` |
| `QA` Quality and Design Gate | Unit, DB, e2e tests, security probes, visual review against the anti-template checklist. Files bug reports. | `tests/**`, `docs/agent-log/bugs/**` |
| `OPS` Deployment | Vercel and Supabase production setup, env vars, backups, release checklist. | `docs/ops/**`, CI config |

Hard rules for every agent:

1. Do not add features outside section 1. If a request implies one, file a `QUESTION` handoff.
2. Do not leave `TODO`, `FIXME`, placeholder text, `console.log`, or commented-out code at a phase exit.
3. Do not edit files you do not own. Request changes through a handoff.
4. Never use the Supabase service-role key anywhere in the app. The app uses only the anon (publishable) key plus the user session.
5. Never do money arithmetic with JavaScript floats. Use integer paise helpers (section 6.2) or let the database compute.
6. Every phase ends with `pnpm typecheck && pnpm lint && pnpm test` green (and `pnpm test:db` once DB exists).

---

## 3. Orchestration protocol

### 3.1 File ownership map

| Path | Owner |
|------|-------|
| `supabase/**` | DB |
| `src/lib/contracts/**`, `src/lib/money.ts`, `src/lib/phone.ts`, `src/lib/ist.ts`, `src/lib/whatsapp.ts`, `src/lib/reminder.ts`, `src/lib/supabase/**`, `src/lib/server/**`, `src/lib/fixtures/**`, `src/middleware.ts`, `src/app/**/actions.ts` | API |
| `src/styles/**`, `src/components/ui/**`, `src/components/ledger/**`, `src/app/layout.tsx`, `docs/design/**` | DSYS |
| `src/app/**/page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `src/components/screens/**` | UI |
| `tests/**`, `docs/agent-log/bugs/**` | QA |
| `docs/ops/**`, `.github/**`, `vercel.json` | OPS |
| `docs/agent-log/STATE.md`, this file | ORCH |
| `docs/agent-log/handoffs/**`, `docs/agent-log/LESSONS.md` | any agent appends only its own entries |

### 3.2 Contract-first parallelism

1. In Phase 0, `DB` and `API` freeze the contracts in sections 5 and 6 into code (`supabase/migrations/*.sql` drafts and `src/lib/contracts/*.ts`).
2. `API` also ships **fixture-backed stubs** for every server read and action, returning realistic typed data from `src/lib/fixtures/*.ts` when `CHAI_FIXTURES=1`. This lets `DSYS` and `UI` build immediately against the real function signatures.
3. When a real implementation lands, `API` removes the fixture branch for that function. At Phase 5 exit, `src/lib/fixtures/**` and every `CHAI_FIXTURES` reference must be gone (QA verifies with grep).
4. A contract change after Phase 0 requires an `ORCH`-approved `CONTRACT_CHANGE` handoff listing every affected agent. Affected agents update within the same phase.

### 3.3 Handoff protocol

When an agent finishes a task or needs something, it writes `docs/agent-log/handoffs/<phase>-<from>-to-<to>-<slug>.md` using the template in Appendix A and notes it in `STATE.md`. Types: `DELIVERY`, `REQUEST`, `QUESTION`, `CONTRACT_CHANGE`.

### 3.4 QA fix loop

1. `QA` files `docs/agent-log/bugs/BUG-<nnn>.md` (template in Appendix B) with severity `S1` (data or security), `S2` (flow broken), `S3` (cosmetic or copy).
2. `ORCH` routes it to the owning agent within the same phase.
3. The owner fixes it, adds a regression test or asks `QA` to, and replies in the bug file.
4. `QA` re-verifies. Maximum **3 loops** per bug. On the fourth, `ORCH` decides and records a lesson.
5. Phase exit requires zero open `S1` and `S2`. `S3` may be deferred only with `ORCH` approval and a line in `STATE.md`.

### 3.5 Lessons log (shared memory)

After every closed bug or rejected approach, the owning agent appends one line to `docs/agent-log/LESSONS.md`:

```
YYYY-MM-DD | <agent> | <area> | Symptom -> Cause -> Rule to follow next time
```

Every agent reads `LESSONS.md` before starting a task.

### 3.6 Definition of done (per task)

- Behavior matches this spec, not a nearby guess.
- Types are strict, no `any`, no non-null assertions on external data.
- Loading, empty, error and success states exist for every screen the task touches.
- Tests listed for the task in section 9 exist and pass.
- Handoff delivered.

---

## 4. Repository layout

```
chai-ledger/
  docs/
    agent-log/ STATE.md, LESSONS.md, handoffs/, bugs/
    design/    tokens.md, components.md, review-checklist.md
    ops/       release-checklist.md, backup-restore.md
  supabase/
    config.toml
    migrations/ 0001_schema.sql, 0002_rls.sql, 0003_views.sql, 0004_rpc.sql, 0005_grants.sql
    tests/      01_constraints.sql, 02_rpc.sql, 03_rls.sql
    seed.sql    (dev only)
  src/
    middleware.ts
    styles/globals.css
    lib/
      contracts/ common.ts, customers.ts, transactions.ts, settings.ts, dashboard.ts
      supabase/  server.ts, client.ts, middleware.ts
      server/    auth.ts, customers.ts, transactions.ts, dashboard.ts, settings.ts, reminders.ts, mappers.ts, errors.ts
      fixtures/  customers.ts, ledger.ts, dashboard.ts, settings.ts
      money.ts, phone.ts, ist.ts, whatsapp.ts, reminder.ts
    components/
      ui/        (restyled shadcn primitives)
      ledger/    MoneyText, BalanceLine, LedgerList, LedgerRow, AmountField, NoteChips, CustomerPicker
      screens/   AppShell, BottomNav, SideNav, DashboardView, CustomerListView, CustomerDetailView, EntryForm, ReminderSheet, ReverseSheet, ConfirmSheet, ResultSheet, SettingsForm, EmptyState, InlineError
    app/
      layout.tsx
      (auth)/login, forgot-password, reset-password, auth/confirm (route.ts)
      (app)/layout.tsx, page.tsx, customers/, customers/new, customers/[id], customers/[id]/edit, entry, settings
  tests/ unit/, e2e/, visual/
```

Package manager: `pnpm`. Node 20 or newer. Pin exact dependency versions in `package.json` at scaffold time and record them in `LESSONS.md`.

Scripts: `dev`, `build`, `typecheck` (`tsc --noEmit`), `lint`, `test` (Vitest), `test:db` (`supabase test db`), `e2e` (Playwright).

Environment variables (only these):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
CHAI_FIXTURES=            # dev only, removed at Phase 5
```

---

## 5. Database specification (owner: `DB`)

All SQL below is the required behavior. `DB` may adjust syntax to run correctly but must preserve every constraint, policy and function contract. Region for the Supabase project: Mumbai (ap-south-1) if available.

### 5.1 Migration 0001: schema

```sql
create type public.txn_type as enum ('CREDIT', 'PAYMENT');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_name text check (shop_name is null or char_length(btrim(shop_name)) between 1 and 60),
  owner_name text check (owner_name is null or char_length(btrim(owner_name)) between 1 and 60),
  phone text check (phone is null or phone ~ '^91[6-9][0-9]{9}$'),
  default_alert_step numeric(12,2) not null default 500
    check (default_alert_step > 0 and default_alert_step <= 1000000),
  reminder_template text not null default E'Namaste {name} ji! 🙏\n\nAapke account mein ₹{amount} ka udhaar pending hai.\n\nKripya apna pending payment clear kar dein.\n\nDhanyavaad!'
    check (char_length(reminder_template) between 10 and 800),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  phone text not null check (phone ~ '^91[6-9][0-9]{9}$'),
  alert_step numeric(12,2) not null default 500
    check (alert_step > 0 and alert_step <= 1000000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index customers_owner_active_idx on public.customers (owner_id, is_active);
create index customers_owner_phone_idx  on public.customers (owner_id, phone);
create index customers_owner_name_idx   on public.customers (owner_id, lower(name));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  customer_id uuid not null,
  type public.txn_type not null,
  amount numeric(12,2) not null check (amount > 0 and amount <= 100000),
  description text check (description is null or char_length(description) <= 140),
  is_reversal boolean not null default false,
  reversal_of uuid references public.transactions(id) on delete restrict,
  advance_confirmed boolean not null default false,
  idempotency_key uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint transactions_customer_owner_fk
    foreign key (customer_id, owner_id)
    references public.customers (id, owner_id) on delete restrict,
  constraint transactions_reversal_consistency
    check (is_reversal = (reversal_of is not null)),
  constraint transactions_reversal_needs_reason
    check (not is_reversal or (description is not null and char_length(btrim(description)) >= 3)),
  constraint transactions_idempotency_unique unique (owner_id, idempotency_key),
  constraint transactions_one_reversal_per_original unique (reversal_of)
);
create index transactions_customer_time_idx on public.transactions (customer_id, created_at, id);
create index transactions_owner_time_idx    on public.transactions (owner_id, created_at desc);

-- updated_at maintenance
create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ledger immutability: no update, no delete
create function public.block_transaction_mutation() returns trigger language plpgsql as $$
begin raise exception 'TRANSACTIONS_IMMUTABLE' using errcode = 'P0001'; end $$;
create trigger transactions_no_mutation before update or delete on public.transactions
  for each row execute function public.block_transaction_mutation();

-- reversal integrity (defence in depth; the RPC also checks)
create function public.validate_reversal() returns trigger language plpgsql as $$
declare o public.transactions%rowtype;
begin
  if new.is_reversal then
    select * into o from public.transactions where id = new.reversal_of;
    if not found or o.owner_id <> new.owner_id or o.customer_id <> new.customer_id then
      raise exception 'TRANSACTION_NOT_FOUND' using errcode = 'P0001';
    end if;
    if o.is_reversal then
      raise exception 'CANNOT_REVERSE_REVERSAL' using errcode = 'P0001';
    end if;
    if o.type = new.type or o.amount <> new.amount then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger transactions_validate_reversal before insert on public.transactions
  for each row execute function public.validate_reversal();

-- profile row for the owner account
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
```

A reversal of a CREDIT is stored as a `PAYMENT` row with `is_reversal = true`; a reversal of a PAYMENT is stored as a `CREDIT` row with `is_reversal = true`. The balance formula therefore never changes:

```
balance = SUM(amount where type = 'CREDIT') - SUM(amount where type = 'PAYMENT')
```

### 5.2 Migration 0002: Row Level Security

```sql
alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.transactions enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy customers_select_own on public.customers for select to authenticated
  using (owner_id = (select auth.uid()));
create policy customers_insert_own on public.customers for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy customers_update_own on public.customers for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
-- no delete policy on customers

create policy transactions_select_own on public.transactions for select to authenticated
  using (owner_id = (select auth.uid()));
-- no insert/update/delete policy on transactions: writes happen only through the RPCs in 5.4
```

### 5.3 Migration 0003: views (all `security_invoker = true`)

```sql
create view public.customer_balances with (security_invoker = true) as
with b as (
  select c.id, c.owner_id, c.name, c.phone, c.alert_step, c.is_active,
         c.created_at, c.updated_at,
         coalesce(sum(case t.type when 'CREDIT' then t.amount else -t.amount end), 0)::numeric(12,2) as balance,
         max(t.created_at) as last_activity_at
  from public.customers c
  left join public.transactions t on t.customer_id = c.id
  group by c.id
)
select b.*,
  case when b.balance < 0 then 'ADVANCE'
       when b.balance = 0 then 'CLEAR'
       when b.balance >= b.alert_step then 'ALERT'
       else 'OWING' end as status,
  case when b.balance > 0 then floor(b.balance / b.alert_step)::int else 0 end as alert_level
from b;

create view public.transaction_ledger with (security_invoker = true) as
select t.id, t.owner_id, t.customer_id, c.name as customer_name,
       t.type, t.amount, t.description, t.is_reversal, t.reversal_of,
       t.advance_confirmed, t.created_at,
       sum(case t.type when 'CREDIT' then t.amount else -t.amount end)
         over (partition by t.customer_id order by t.created_at, t.id)::numeric(12,2) as running_balance,
       (r.id is not null) as is_reversed
from public.transactions t
join public.customers c on c.id = t.customer_id
left join public.transactions r on r.reversal_of = t.id;
```

Readers must always filter `transaction_ledger` by `customer_id` for the customer ledger. The dashboard "recent" list uses `order by created_at desc, id desc limit 10` across all customers (small data, acceptable).

### 5.4 Migration 0004: RPC functions

Writes to `transactions` happen only here. Functions are `security definer`, `set search_path = ''`, and derive the owner from `auth.uid()` (never from a parameter). Errors are raised as `raise exception '<CODE>' using errcode = 'P0001'` with optional `detail` holding a JSON string. The API layer maps `error.message` to `AppErrorCode`.

**`public.create_transaction(p_customer_id uuid, p_type txn_type, p_amount numeric, p_description text, p_idempotency_key uuid, p_confirm_advance boolean default false) returns jsonb`**

Required order of operations:

1. `v_owner := auth.uid()`; null raises `UNAUTHENTICATED`.
2. Validate: `p_amount` not null, greater than 0, at most 100000, `scale(p_amount) <= 2`, else `AMOUNT_OUT_OF_RANGE`. `p_description` trimmed, empty becomes null, longer than 140 raises `VALIDATION_FAILED`.
3. `select ... from customers where id = p_customer_id and owner_id = v_owner for update`. Not found raises `CUSTOMER_NOT_FOUND`. (The row lock serializes concurrent entries for one customer.)
4. Idempotent replay: if a transaction exists with `(owner_id = v_owner, idempotency_key = p_idempotency_key)`, return `{ "replayed": true, "transaction": {...}, "customer": {...}, "balance_before": null, "balance_after": <current balance>, "alert": null }` without inserting.
5. If `p_type = 'CREDIT'` and customer is not active, raise `CUSTOMER_INACTIVE`.
6. `v_before` := current balance computed from `transactions` for the customer.
7. If `p_type = 'PAYMENT'` and `p_amount > v_before` and not `p_confirm_advance`, raise `ADVANCE_CONFIRMATION_REQUIRED` with `detail = {"balance": "<v_before>", "amount": "<p_amount>", "advance_after": "<p_amount - v_before>"}`.
8. Insert the row with `advance_confirmed = (p_type = 'PAYMENT' and p_amount > v_before)`, `is_reversal = false`.
9. `v_after := v_before +/- p_amount`.
10. Alert calculation (only when `p_type = 'CREDIT'`):
    `level_before = case when v_before > 0 then floor(v_before / alert_step) else 0 end`, same for `level_after`. If `level_after > level_before`, `alert = {"level": level_after, "crossed_amount": (level_after * alert_step)::text}`, else `null`.
11. Return jsonb:

```json
{
  "replayed": false,
  "transaction": { "id": "uuid", "type": "CREDIT", "amount": "50.00", "description": "Chai", "created_at": "iso" },
  "customer": { "id": "uuid", "name": "Rahul Patel", "phone": "919876543210", "alert_step": "500.00" },
  "balance_before": "200.00",
  "balance_after": "250.00",
  "alert": null
}
```

All numerics in the returned JSON are strings (`::text`).

**`public.reverse_transaction(p_transaction_id uuid, p_reason text, p_idempotency_key uuid) returns jsonb`**

1. Auth check; reason trimmed length at least 3 and at most 140, else `VALIDATION_FAILED`.
2. Load original where `id = p_transaction_id and owner_id = v_owner`; not found raises `TRANSACTION_NOT_FOUND`.
3. Lock the customer row `for update`.
4. Idempotent replay on `(owner_id, idempotency_key)` returning the existing reversal with `replayed: true`.
5. Original is a reversal raises `CANNOT_REVERSE_REVERSAL`. A reversal already exists for it raises `ALREADY_REVERSED`.
6. Insert: opposite `type`, same `amount`, `description = btrim(p_reason)`, `is_reversal = true`, `reversal_of = original.id`, `advance_confirmed = false`.
7. Return `{ "replayed": false, "reversal": {"id","type","amount","description","created_at"}, "original_id": "uuid", "balance_after": "text" }`. Reversals never produce alerts. Reversing a credit on an inactive customer is allowed.

**`public.dashboard_summary() returns jsonb`** (`stable`, `security invoker`, `set search_path = ''`)

```json
{
  "total_outstanding": "4250.00",
  "total_advance": "200.00",
  "active_customers": 18,
  "alert_customers": 4,
  "credit_today": "640.00",
  "payments_today": "300.00"
}
```

Definitions:
- `total_outstanding` = sum of `balance` where `balance > 0`, across **all** customers including inactive.
- `total_advance` = absolute sum of negative balances.
- `active_customers` = count where `is_active`.
- `alert_customers` = count where `status = 'ALERT'`.
- `credit_today` / `payments_today` = sum of `amount` of rows with that `type`, `is_reversal = false`, **not reversed**, and `(created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date`.

### 5.5 Migration 0005: grants

```sql
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select on public.transactions to authenticated;
grant select on public.customer_balances, public.transaction_ledger to authenticated;

revoke execute on function public.create_transaction(uuid, public.txn_type, numeric, text, uuid, boolean) from public, anon;
revoke execute on function public.reverse_transaction(uuid, text, uuid) from public, anon;
revoke execute on function public.dashboard_summary() from public, anon;
grant  execute on function public.create_transaction(uuid, public.txn_type, numeric, text, uuid, boolean) to authenticated;
grant  execute on function public.reverse_transaction(uuid, text, uuid) to authenticated;
grant  execute on function public.dashboard_summary() to authenticated;
```

### 5.6 Auth configuration

- `supabase/config.toml`: `[auth] enable_signup = false`. In the hosted project, turn off "Allow new users to sign up" (`OPS` verifies).
- The owner is created once in the Supabase dashboard (Authentication, Users, Add user, auto-confirm). The trigger creates the `profiles` row.
- Password reset email redirect: `${NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`.

### 5.7 DB tests (pgTAP, `supabase/tests/`)

Covered in section 9 (IDs DB-01 to DB-16, RLS-01 to RLS-06). `DB` writes them, `QA` extends them.

---

## 6. Server contracts (owner: `API`)

### 6.1 Shared types and error codes (`src/lib/contracts/common.ts`)

```ts
import { z } from "zod";

export const APP_ERROR_CODES = [
  "UNAUTHENTICATED", "VALIDATION_FAILED", "AMOUNT_OUT_OF_RANGE", "INVALID_PHONE",
  "DUPLICATE_PHONE", "CUSTOMER_NOT_FOUND", "CUSTOMER_INACTIVE",
  "ADVANCE_CONFIRMATION_REQUIRED", "TRANSACTION_NOT_FOUND", "ALREADY_REVERSED",
  "CANNOT_REVERSE_REVERSAL", "NO_BALANCE_DUE", "INVALID_CREDENTIALS", "INTERNAL",
] as const;
export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: AppErrorCode; message: string;
      fieldErrors?: Record<string, string>; details?: unknown } };

export const uuid = z.string().uuid();

// Amount arrives as a string. The UI strips ₹, commas and spaces before sending.
export const amountString = z.string().trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter an amount like 50 or 50.50")
  .refine((v) => Number(v) > 0 && Number(v) <= 100000,
          "Amount must be between ₹0.01 and ₹1,00,000");

export const noteString = z.string().trim().max(140, "Keep the note under 140 characters")
  .transform((v) => (v === "" ? null : v)).nullable();
```

Rules for all actions and readers:

1. First line of every action and reader: `const { supabase, user } = await requireUser()` (in `src/lib/server/auth.ts`). It calls `supabase.auth.getUser()` (never trust `getSession()` alone). Failure returns `UNAUTHENTICATED`; pages redirect to `/login`.
2. Every action parses input with zod. Failure returns `VALIDATION_FAILED` with `fieldErrors` keyed by input field name.
3. Actions never throw to the client. Unknown errors are logged server-side (without phone numbers or amounts) and returned as `INTERNAL` with message "Could not save. Nothing was changed. Try again."
4. PostgREST/RPC errors map by `error.message` equal to a code in `APP_ERROR_CODES`; anything else is `INTERNAL`. `error.details` (JSON string) is parsed into `details`.
5. All `numeric` values leaving the server are strings with two decimals. Views return JSON numbers; `mappers.ts` converts with `n.toFixed(2)`.
6. After a successful mutation call `revalidatePath` for `/`, `/customers`, and `/customers/[id]` as relevant.
7. Never log or return the service-role key; it is not used.

### 6.2 Pure libraries (exact behavior, unit-tested)

**`src/lib/money.ts`**

| Function | Behavior |
|----------|----------|
| `parseAmountToPaise(input: string): number or null` | Strip `₹`, commas, spaces. Must match `^\d{1,6}(\.\d{1,2})?$`, greater than 0, at most 100000. Returns integer paise or `null`. |
| `paiseToString(p: number): string` | `5000` becomes `"50.00"`. |
| `moneyToPaise(s: string): number` | Parses a server money string (may be negative) to integer paise. |
| `formatINR(s: string): string` | `en-IN` grouping with `₹`. No decimals when paise is zero: `"₹1,250"`; otherwise two decimals: `"₹1,250.50"`. Lakh grouping: `"100000.00"` becomes `"₹1,00,000"`. Negative values keep a leading minus. |
| `formatINRPlain(s: string): string` | Same without the `₹` symbol (used in the reminder template). |

**`src/lib/phone.ts`**

| Function | Behavior |
|----------|----------|
| `normalizePhone(input: string): string or null` | Remove every non-digit. Accept: 10 digits starting 6-9; 11 digits starting `0` then a valid 10; 12 digits starting `91` then a valid 10; 14 digits starting `0091` then a valid 10. Return `"91" + 10 digits`. Anything else returns `null`. |
| `isStoredPhone(s: string): boolean` | Matches `^91[6-9][0-9]{9}$`. |
| `formatPhoneDisplay(s: string): string` | `"919876543210"` becomes `"+91 98765 43210"`. |

**`src/lib/ist.ts`**: `formatIST(iso, "time" | "date" | "datetime")` using `Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ... })`. Outputs: time `6:42 pm`, date `4 Nov`, datetime `4 Nov, 6:42 pm` (add the year when not the current IST year). `dayLabelIST(iso)` returns `Today`, `Yesterday`, or the date, comparing IST calendar days.

**`src/lib/reminder.ts`**

```ts
renderReminder(template: string, v: { name: string; amount: string; shop: string | null }): string
```
Replaces `{name}` with the saved customer name, `{amount}` with `formatINRPlain(amount)`, `{shop}` with the shop name (or empty). Unknown placeholders are left as typed. Result is trimmed, capped at 1000 characters. Settings validation (`updateSettingsAction`) requires the template to contain `{name}` and `{amount}` and only the placeholders `{name}`, `{amount}`, `{shop}`.

**`src/lib/whatsapp.ts`**

```ts
buildWhatsAppUrl(storedPhone: string, message: string): string
// throws Error("INVALID_PHONE") if !isStoredPhone(storedPhone)
// returns `https://wa.me/${storedPhone}?text=${encodeURIComponent(message)}`
```
The UI renders this as a normal `<a href target="_blank" rel="noopener noreferrer">`, never `window.open` (avoids popup blockers). After tapping, the UI may say "WhatsApp opened. Press Send there." It must never say "sent" or log a send.

### 6.3 Data shapes (`src/lib/contracts/*.ts`)

```ts
export type CustomerStatus = "CLEAR" | "OWING" | "ALERT" | "ADVANCE";

export type CustomerBalance = {
  id: string; name: string; phone: string;          // phone is stored form 91XXXXXXXXXX
  alertStep: string; isActive: boolean;
  balance: string;                                   // may be negative (advance)
  status: CustomerStatus; alertLevel: number;
  lastActivityAt: string | null; createdAt: string; updatedAt: string;
};

export type LedgerEntry = {
  id: string; customerId: string; customerName: string;
  type: "CREDIT" | "PAYMENT"; amount: string; description: string | null;
  isReversal: boolean; reversalOf: string | null; isReversed: boolean;
  advanceConfirmed: boolean; runningBalance: string; createdAt: string;
};

export type DashboardSummary = {
  totalOutstanding: string; totalAdvance: string; activeCustomers: number;
  alertCustomers: number; creditToday: string; paymentsToday: string;
  needsReminder: CustomerBalance[];     // status ALERT, sorted by balance desc, max 20
  recent: LedgerEntry[];                // latest 10 across customers
};

export type Settings = {
  shopName: string | null; ownerName: string | null; phone: string | null;
  defaultAlertStep: string; reminderTemplate: string;
};

export type CreateTransactionResult = {
  replayed: boolean;
  transaction: { id: string; type: "CREDIT" | "PAYMENT"; amount: string;
                 description: string | null; createdAt: string };
  customer: { id: string; name: string; phone: string; alertStep: string };
  balanceBefore: string | null; balanceAfter: string;
  alert: { level: number; crossedAmount: string } | null;
};

export type ReverseTransactionResult = {
  replayed: boolean; originalId: string; balanceAfter: string;
  reversal: { id: string; type: "CREDIT" | "PAYMENT"; amount: string;
              description: string; createdAt: string };
};

export type ReminderDraft = {
  customerId: string; customerName: string; phone: string;
  balance: string; message: string;
};
```

### 6.4 Server actions (mutations; `src/app/**/actions.ts`)

| Action | Input (zod) | Success `data` | Error codes |
|--------|-------------|----------------|-------------|
| `loginAction` | `{ email: string.email, password: string.min(1) }` | `{ redirectTo: string }` (validated same-origin `next`, default `/`) | `INVALID_CREDENTIALS`, `VALIDATION_FAILED` |
| `logoutAction` | none | `{}` then redirect `/login` | none |
| `requestPasswordResetAction` | `{ email }` | `{}` always (no account enumeration) | `VALIDATION_FAILED` |
| `updatePasswordAction` | `{ password: string.min(8).max(72) }` | `{}` | `UNAUTHENTICATED`, `VALIDATION_FAILED` |
| `createCustomerAction` | `{ name: trim 1..80, phone: string, alertStep: amountString, confirmDuplicate: boolean default false }` | `CustomerBalance` | `INVALID_PHONE`, `DUPLICATE_PHONE`, `VALIDATION_FAILED` |
| `updateCustomerAction` | `{ id: uuid, name, phone, alertStep, confirmDuplicate }` | `CustomerBalance` | same plus `CUSTOMER_NOT_FOUND` |
| `setCustomerActiveAction` | `{ id: uuid, isActive: boolean }` | `CustomerBalance` | `CUSTOMER_NOT_FOUND` |
| `createTransactionAction` | `{ customerId: uuid, type: "CREDIT" or "PAYMENT", amount: amountString, description: noteString, idempotencyKey: uuid, confirmAdvance: boolean default false }` | `CreateTransactionResult` | `CUSTOMER_NOT_FOUND`, `CUSTOMER_INACTIVE`, `ADVANCE_CONFIRMATION_REQUIRED`, `AMOUNT_OUT_OF_RANGE`, `VALIDATION_FAILED` |
| `reverseTransactionAction` | `{ transactionId: uuid, reason: trim 3..140, idempotencyKey: uuid }` | `ReverseTransactionResult` | `TRANSACTION_NOT_FOUND`, `ALREADY_REVERSED`, `CANNOT_REVERSE_REVERSAL`, `VALIDATION_FAILED` |
| `updateSettingsAction` | `{ shopName: trim max 60 or null, ownerName: same, phone: string or null (normalized; invalid gives INVALID_PHONE), defaultAlertStep: amountString, reminderTemplate: string 10..800 with placeholder rules }` | `Settings` | `INVALID_PHONE`, `VALIDATION_FAILED` |

Behavior details:

- **Duplicate phone:** `createCustomerAction` and `updateCustomerAction` normalize the phone, then query `customers` for the same `owner_id` and `phone` (excluding the record being edited). If any match and `confirmDuplicate` is false, return `DUPLICATE_PHONE` with `details: { existing: [{ id, name, isActive }] }` and insert nothing. The UI shows the warning and resubmits with `confirmDuplicate: true` if the owner proceeds.
- **Create customer:** `owner_id` is set server-side from `user.id`, never from the client.
- **Deactivate:** allowed at any balance (D-07). Reactivate allowed.
- **Idempotency:** the client creates `crypto.randomUUID()` when the entry form mounts and after each successful save. A retry after a network failure reuses the same key.
- **Advance flow:** the action passes `p_confirm_advance = confirmAdvance`. When the DB raises `ADVANCE_CONFIRMATION_REQUIRED`, the action returns it with `details` so the UI can show the confirm sheet and resubmit with `confirmAdvance: true` and the same key.

### 6.5 Server readers (called from server components, `src/lib/server/*`)

| Function | Returns | Notes |
|----------|---------|-------|
| `getDashboard()` | `DashboardSummary` | Calls `dashboard_summary()` RPC, plus `customer_balances` filtered `status = 'ALERT'` ordered by `balance desc` limit 20, plus latest 10 `transaction_ledger` rows. |
| `listCustomers({ q?, status })` | `CustomerBalance[]` | `status` is `"active"`, `"inactive"` or `"all"` (default `active`). `q` matches `name ilike %q%` or `phone like %digits%`. Order by `lower(name)`. Max 500. |
| `listCustomersForPicker()` | `CustomerBalance[]` | All customers (active and inactive) ordered by `last_activity_at desc nulls last, lower(name)`, max 500. The picker filters client-side. |
| `getCustomer(id)` | `CustomerBalance` or `null` | `null` renders `not-found`. |
| `getLedger({ customerId, before? })` | `{ entries: LedgerEntry[]; nextCursor: string or null }` | Newest first, page size 50. Cursor is `"<created_at>|<id>"`. Always filters by `customer_id`. |
| `getSettings()` | `Settings` | Reads own `profiles` row. |
| `getReminderDraft(customerId)` | `ActionResult<ReminderDraft>` | Loads customer and settings. Balance not greater than 0 returns `NO_BALANCE_DUE`. Stored phone failing `isStoredPhone` returns `INVALID_PHONE`. Message from `renderReminder`. |

### 6.6 Auth, middleware, headers

- `src/middleware.ts` refreshes the Supabase session (`@supabase/ssr`) and redirects unauthenticated requests for any path outside `/login`, `/forgot-password`, `/reset-password`, `/auth/confirm`, static assets to `/login?next=<path>`. Authenticated users hitting `/login` go to `/`.
- Session persists via Supabase cookies. Logout clears them.
- `next.config.ts` headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- No financial data in `localStorage` or `sessionStorage`. The only client-side persistence allowed is the entry form's idempotency key in component state.

---

## 7. Frontend specification (owners: `DSYS` and `UI`)

### 7.1 Design intent

This is a tool a tea-stall owner uses with one hand, in a bright shop, in 10 to 15 seconds per entry. It should feel like a well-kept **khata (ledger book) turned into software**: ruled lines, ink colors with meaning, numbers aligned like a real ledger. It must not look like a generated SaaS template.

Spend the boldness in **one place: the customer ledger** (double margin rule, ruled rows, running balance). Everything else is quiet, plain and fast.

### 7.2 Tokens (`src/styles/globals.css`, owner `DSYS`)

```css
:root {
  --paper:        #F1F3EE;  /* page background, cool newsprint */
  --sheet:        #FFFFFF;  /* ledger pages, inputs, sheets */
  --ink:          #17212B;  /* primary text, primary buttons */
  --ink-soft:     #4A5866;  /* secondary text */
  --rule:         #C9D3DA;  /* hairlines between rows */
  --rule-margin:  #B84A42;  /* the khata margin double-rule only */
  --owed:         #A3261F;  /* udhaar amounts, money owed */
  --paid:         #1F6B4A;  /* payments, advance */
  --alert-ink:    #8A5A00;  /* alert text */
  --alert-wash:   #FBEFD0;  /* alert row background */
  --focus:        #2457C5;  /* focus ring */
  --radius-chip: 6px;
  --radius-control: 10px;
  --radius-sheet: 20px;     /* top corners of bottom sheets only */
  --tap: 48px;              /* minimum touch target */
}
```

Rules: light theme only. No gradients. No glass or blur. No box-shadow except one soft shadow on bottom sheets. `owed` and `paid` always appear with a text or sign cue (never color alone). Contrast: text on `sheet` and `paper` at least 4.5:1 (the values above meet this; `DSYS` verifies and records the ratios in `docs/design/tokens.md`).

Typography: **one family, Atkinson Hyperlegible** via `next/font/google`, weights 400 and 700 only, chosen for legibility of digits on small screens in bright light. `font-variant-numeric: tabular-nums` on every money value. Scale: 14 (meta), 16 (body, minimum for inputs), 18 (list names), 22 (screen titles), 32 (amount input and the single balance figure on a customer). Sentence case everywhere. Line length under 70 characters. Do not use a monospace face.

Radii are three different values by role (chip, control, sheet); ledger rows and tables have no radius. Spacing scale: 4, 8, 12, 16, 24, 32. Icons: `lucide-react`, 20px, stroke 1.75, used only where a word is also present or the meaning is universal (search, back, close).

Motion: only responses to the owner's actions: bottom sheet slide (150 ms ease-out), button press (scale 0.98), and the balance number replacing itself on the result sheet. No page-load animation, no entrance fades, no hover effects on rows. Respect `prefers-reduced-motion` by removing all of it.

shadcn/ui usage: use primitives only (`Drawer` from vaul for sheets, `Dialog`, `Command` for the picker, `Select`, `Input`, `Textarea`, `Label`, `Sonner` for nothing money-related). **Restyle every primitive to the tokens above** and delete the default theme variables (`--card`, `--muted`, zinc palette). Do not use shadcn `Card`. Do not ship any shadcn component with its default look.

### 7.3 Banned patterns (QA greps and reviews for these)

1. Gradient fills or gradient text anywhere.
2. Rows of identical rounded cards with the same shadow. Lists are ruled rows, not cards.
3. ALL CAPS labels, tracked-out eyebrow labels above headings, numbered markers (01, 02), "WORD — fragment" labels.
4. A single accented word inside a heading.
5. Emoji as UI icons (the `🙏` appears only inside the WhatsApp message text).
6. Colored circle avatars with initials.
7. Metadata strings joined with middle dots ("A · B · C"). Use separate lines or a definition list.
8. A hero banner, illustration, stock icon grid or decorative blob on any screen.
9. Fade-and-slide-in on sections, hover lifts on rows.
10. Toasts for money results (results use the result sheet, section 7.6).
11. Generic copy: "Welcome back!", "Oops!", "Something went wrong", "Submit".
12. Default shadcn zinc look, default `Card`, or `rounded-xl` on everything.

### 7.4 Navigation and shell

- **Mobile (below 768px):** fixed bottom bar, 64px high, five items: Home, Customers, Udhaar, Payment, More. Udhaar is filled `--owed` with white text and Payment is filled `--paid` with white text (they are the two primary actions); Home and Customers are text-and-icon in `--ink`; More opens a small sheet with Settings and Log out. Active route is marked with a 2px `--ink` top rule on the item, plus bold label.
- **Desktop (768px and up):** left sidebar 240px on `--paper` with a `--rule` right border: wordmark "Chai Ledger" in 18px bold (plain text, no logo), nav links Dashboard, Customers, Add udhaar, Add payment, Settings, Log out. Content max width 960px, left aligned.
- All content is left aligned. Amounts are right aligned in ledger rows.
- `app/layout.tsx` sets `<html lang="en-IN">`, viewport `width=device-width, initial-scale=1`, and `theme-color` equal to `--paper`.

### 7.5 Routes and screens (owner `UI`)

| Route | Screen | Data | Notes |
|-------|--------|------|-------|
| `/login` | Login | none | Email, password, "Log in", link "Forgot password". No signup link. |
| `/forgot-password` | Request reset | none | Always shows "If that email has an account, a reset link is on its way." |
| `/auth/confirm` | Route handler | token hash | Verifies OTP via Supabase, redirects to `next`. |
| `/reset-password` | Set new password | session | Two fields, min 8 characters. |
| `/` | Dashboard | `getDashboard()` | Section 7.6.1. |
| `/customers` | Customer list | `listCustomers` | Search input (debounced 200 ms, URL `?q=`), filter Active / Inactive / All (`?status=`), "Add customer" button. |
| `/customers/new` | Add customer | `getSettings()` for default step | Fields: Name, Mobile number, Alert step (prefilled with default). |
| `/customers/[id]` | Customer details and ledger | `getCustomer`, `getLedger` | Section 7.6.3. |
| `/customers/[id]/edit` | Edit customer | `getCustomer` | Same form as new, plus Deactivate / Reactivate at the bottom. |
| `/entry` | Add udhaar or payment | `listCustomersForPicker()` | `?type=udhaar` (default) or `payment`, optional `?customer=<uuid>`. Section 7.6.2. |
| `/settings` | Settings | `getSettings()` | Shop name, owner name, owner phone, default alert step, reminder template with live preview (sample: Rahul, 500). Change password link. |

Every route has `loading.tsx` (skeleton made of ruled rows, no shimmer animation) and `error.tsx` ("This page could not load. Check your connection and reload." with a Reload button). Unknown ids render `not-found.tsx` ("This customer does not exist or is not yours." with a link to Customers).

### 7.6 Screen specifications

#### 7.6.1 Dashboard (`/`)

Order top to bottom (mobile). Alerts first because they are the thing to act on.

```
┌ Chai Ledger ───────────────────────┐
│ [ Add udhaar ]   [ Add payment ]   │  two 56px buttons, owed / paid fills
│                                    │
│ Needs a reminder (4)               │  list of ruled rows, alert-wash bg
│ Amit Shah        Crossed ₹1,000    │    right: balance ₹1,150
│ Jay Mehta        Crossed ₹500      │    tap row = customer details
│ ...                                │
│                                    │
│ Today                              │  ruled definition list
│ Udhaar given            ₹640       │
│ Payments received       ₹300       │
│                                    │
│ All customers                      │
│ Total outstanding       ₹4,250     │
│ Advance held            ₹200       │  hidden when 0
│ Active customers        18         │
│                                    │
│ Recent entries                     │  10 ruled rows (LedgerRow compact)
└────────────────────────────────────┘
```

- "Needs a reminder" rows show the customer name, "Crossed ₹<level × step>" and the balance. Each row has a trailing text button "Remind" that opens the ReminderSheet directly. Empty state: "No customer has crossed their alert step."
- Totals are a plain definition list with hairline rules. No big-number tiles.
- On desktop, columns: left (Needs a reminder, Recent entries), right 320px (Today, All customers).

#### 7.6.2 Entry (`/entry`)

Goal: save in 10 to 15 seconds.

1. Segmented switch at top: **Udhaar** | **Payment** (two buttons, selected has `--ink` fill). State lives in the URL.
2. Customer field (full-width button, 56px). Tapping opens a bottom sheet with a search input and the list from `listCustomersForPicker()`, most recent first, filtered client-side by name or phone digits. Each row shows name and the balance with its cue. For Udhaar, inactive customers are hidden. For Payment, inactive customers are shown only if balance is not 0. If opened with `?customer=`, it is preselected and the amount field is focused.
3. After a customer is chosen, a one-line balance readout appears under the field: "Owes ₹250" / "Settled" / "Advance ₹200".
4. Amount field: `inputmode="decimal"`, 32px text, label "Amount", prefix `₹`. Quick-add chips below: `+10`, `+20`, `+50`, `+100` (each adds to the current value), and `Clear`. Chips are 44px tall, `--radius-chip`.
5. Note field (optional), label "Note". Chips below: Chai, Cold drink, Cigarette, Paan, General. Tapping a chip puts that text in the field; tapping the active chip clears it. Typing is always allowed.
6. Sticky footer button, 56px, full width: "Save udhaar" (owed fill) or "Save payment" (paid fill). Disabled until a customer and a valid amount exist. While pending: label "Saving…", disabled, no double submit.
7. Payment greater than the balance (compare in integer paise using picker data): open ConfirmSheet "Payment is more than the balance." with rows Balance, Payment, Advance after. Buttons "Save as advance" and "Change amount". The server enforces the same rule and may return `ADVANCE_CONFIRMATION_REQUIRED`; handle it identically.
8. Udhaar for a customer whose balance is already at or past an alert level gets **no** blocking warning (D-04). The alert appears only after saving, if a new multiple was crossed.
9. Failure: stay on the form, keep values, show InlineError above the footer: the server message, or "Not saved. Check your connection and try again." for network errors. The same idempotency key is reused. Never show success unless `ok: true`.
10. Success: open ResultSheet (7.6.4). Reset the form (keep type, clear customer, amount, note) only when the sheet is dismissed, and generate a new idempotency key then.

#### 7.6.3 Customer details (`/customers/[id]`)

```
← Customers
Rahul Patel                      Edit
+91 98765 43210
Owes ₹1,150                      32px, --owed
Alert every ₹500                 14px, --ink-soft
[Add udhaar] [Add payment]       two 48px buttons
[Send WhatsApp reminder]         full width, outline
─────────────────────────────────
Ledger  (khata)
║║ Today
║║ 6:42 pm   Chai        Udhaar ₹50
║║                       Balance ₹1,150
║║ 4:10 pm   Payment     Paid ₹200
║║                       Balance ₹1,100
║║ Yesterday ...
[Load older entries]
```

- Status line variants: `OWING` "Owes ₹X" in `--owed`; `ALERT` same plus a line "Crossed ₹<level × step>" on `--alert-wash`; `CLEAR` "Settled" in `--ink-soft`; `ADVANCE` "Advance ₹X" in `--paid`. Inactive customers show a line "Inactive. New udhaar is blocked." and the Add udhaar button is disabled.
- "Send WhatsApp reminder" opens ReminderSheet. Disabled with a visible reason beneath when balance is 0 or less ("Nothing is due.") or the phone is invalid ("Fix the mobile number to send a reminder." with a link to Edit).
- **Ledger component (the memorable element):** a white sheet with a **double vertical margin rule** at the left (two 1px lines of `--rule-margin`, 3px apart, 12px from the edge), horizontal hairlines (`--rule`) between rows, day headers ("Today", "Yesterday", "3 Nov") in 14px bold `--ink-soft` on `--paper`. Each row: left column time and note, right column amount line (`Udhaar ₹50` in `--owed` or `Paid ₹200` in `--paid`) with the running balance under it in 14px `--ink-soft`. Reversed originals show the amount struck through and the word "Reversed" beneath the note. Reversal rows show "Reversal: <reason>". Advance payments show "Advance" under the amount. On desktop the row becomes columns: Date, Note, Udhaar, Paid, Balance, right aligned for money.
- Tapping a row opens ReverseSheet showing the full entry (date and time in IST, amount, note). It has "Reverse this entry" unless the row is a reversal or already reversed (then a plain explanation). Reverse form: Reason (required, 3 to 140 characters), button "Reverse entry". On success the ledger refreshes and the sheet shows the new balance.

#### 7.6.4 Sheets

- **ResultSheet** (after every save). Content: line 1 "₹50 udhaar added for Rahul Patel." or "₹200 payment recorded for Rahul Patel."; line 2 "Balance ₹1,150" (32px, with owed/paid/advance cue). If `alert` is present: a second block on `--alert-wash`: "Rahul Patel's balance crossed ₹1,000." with the primary button "Open WhatsApp reminder" (builds the draft via `getReminderDraft`, then the link; see ReminderSheet). Always: "Done" button and a text button "Entered by mistake? Reverse it" that opens the reason field inline and calls `reverseTransactionAction`. If `replayed` is true, line 1 says "This entry was already saved."
- **ReminderSheet**: title "Reminder for Rahul Patel", read-only phone, an editable textarea containing the generated message (regenerated from `getReminderDraft`; edits are local), then the primary link "Open WhatsApp" (`buildWhatsAppUrl`, built client-side from the current textarea text) and "Close". Helper text under the link: "This opens WhatsApp with the message ready. Press Send in WhatsApp." After tapping the link the helper text changes to "WhatsApp opened. Press Send there." The app records nothing about reminders. If `getReminderDraft` returns `NO_BALANCE_DUE` or `INVALID_PHONE`, show the specific message and no link.
- **ConfirmSheet**: title, a ruled list of figures, two buttons (confirm, change). Used only for advance payment and duplicate phone.
- Duplicate phone warning (customer form): ConfirmSheet "This number is already saved for Amit Shah." listing each existing customer (name, active or inactive) with buttons "Save anyway" and "Change number".

### 7.7 Components (`DSYS` builds, `UI` composes)

| Component | Props | Rule |
|-----------|-------|------|
| `MoneyText` | `value: string; tone?: "owed" or "paid" or "plain"; size?: "meta" or "body" or "figure"` | Applies `formatINR`, tabular numerals, tone color. |
| `BalanceLine` | `status; balance; alertStep; alertLevel` | Renders the status variants in 7.6.3. Always includes words, never color only. |
| `LedgerList` | `entries: LedgerEntry[]; onSelect(entry)` | Day grouping via `dayLabelIST`, margin rule, hairlines. |
| `LedgerRow` | `entry; compact?: boolean` | `compact` shows customer name (dashboard recent). |
| `AmountField` | `value; onChange; error?` | Sanitizes to digits and one dot, max 2 decimals, never exceeds 100000. |
| `NoteChips` | `value; onChange` | Chips listed in 7.6.2. |
| `CustomerPicker` | `customers; mode: "udhaar" or "payment"; value; onChange` | Client-side search, 48px rows. |
| `ConfirmSheet`, `ResultSheet`, `ReminderSheet`, `ReverseSheet` | see 7.6.4 | Built on `Drawer`. Focus trapped, Escape closes, labelled. |
| `EmptyState` | `title; body?; action?` | Text only. No illustration. |
| `InlineError` | `message; id` | Linked to the field via `aria-describedby`. |

Accessibility floor (all screens): visible focus ring (`--focus`, 2px, 2px offset), 48px minimum targets, labels bound to inputs, errors announced (`role="alert"`), `lang="en-IN"`, sheet focus management, no information by color alone, works at 200% zoom, no horizontal scroll at 320px.

### 7.8 Copy deck (use exactly; sentence case)

| Place | Text |
|-------|------|
| Entry save buttons | "Save udhaar", "Save payment" |
| Saving state | "Saving…" |
| Network failure | "Not saved. Check your connection and try again." |
| Server failure | "Could not save. Nothing was changed. Try again." |
| Invalid amount | "Enter an amount like 50 or 50.50." |
| Amount too large | "Amount must be between ₹0.01 and ₹1,00,000." |
| Invalid phone | "Enter a 10-digit mobile number starting with 6, 7, 8 or 9." |
| Customer empty list | "No customers yet. Add your first customer to start recording udhaar." |
| Search no result | "No customer matches \"<q>\"." |
| Ledger empty | "No entries yet." |
| Inactive blocked | "Inactive. New udhaar is blocked." |
| Advance confirm | "Payment is more than the balance." |
| Login failure | "Email or password is wrong." |
| Not found | "This customer does not exist or is not yours." |
| Reverse reason label | "Reason for reversing" |

---

## 8. Phases, tasks and exit criteria

Phases are sequential gates. Tasks inside a phase run in parallel unless a dependency is named. `ORCH` opens a phase only when the previous exit criteria are all checked.

### Phase 0: Contracts and scaffold

| Task | Owner | Output |
|------|-------|--------|
| P0-T1 Scaffold Next.js, TypeScript strict, Tailwind, shadcn init, Vitest, Playwright, ESLint, `pnpm` scripts | API | Running app shell |
| P0-T2 Write `src/lib/contracts/**` from section 6 | API | Types and zod schemas |
| P0-T3 Write `money.ts`, `phone.ts`, `ist.ts`, `reminder.ts`, `whatsapp.ts` with unit tests (M-, PH-, WA- IDs) | API | Pure libs, tests green |
| P0-T4 Fixture-backed stubs for every reader and action | API | `CHAI_FIXTURES=1` works |
| P0-T5 Draft migrations 0001 to 0005 exactly per section 5 | DB | SQL files committed, not yet applied to prod |
| P0-T6 Write `docs/design/tokens.md` and `globals.css` tokens, fonts | DSYS | Tokens render on a scratch page |

Exit criteria:
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass.
- [ ] Contracts compile and match sections 5 and 6 (QA diff review).
- [ ] Fixture mode returns every shape in 6.3.
- [ ] Migrations apply cleanly with `supabase db reset`.

### Phase 1: Foundation (database, auth, shell)

| Task | Owner | Output |
|------|-------|--------|
| P1-T1 Apply migrations, write pgTAP tests DB-01..DB-16 and RLS-01..RLS-06 | DB | `pnpm test:db` green |
| P1-T2 Supabase clients, `requireUser`, middleware, login, logout, password reset flow | API | Real auth working |
| P1-T3 Restyled primitives: Button, Input, Label, Textarea, Drawer, Dialog, Command, Select, EmptyState, InlineError | DSYS | `components/ui/**` |
| P1-T4 AppShell, BottomNav, SideNav, layout, login screens, loading and error pages | UI | Navigable shell |
| P1-T5 QA: auth and RLS probes (unauthenticated access, wrong-owner access via the API) | QA | Tests E2E-01, RLS-* |

Exit criteria:
- [ ] Owner logs in and out; unauthenticated requests to every protected route redirect to `/login`.
- [ ] Public signup is rejected (`enable_signup = false` verified by an attempted signup call).
- [ ] RLS tests prove another user cannot read or write this owner's rows.
- [ ] Shell passes the design gate (section 9.3) at 360px and 1280px.

### Phase 2: Customers

| Task | Owner | Output |
|------|-------|--------|
| P2-T1 Customer readers and actions (create, update, set active, duplicate phone warning) | API | Real implementations, fixtures removed for these |
| P2-T2 `CustomerListView`, search, filters, customer form, duplicate ConfirmSheet, edit, deactivate | UI | Screens |
| P2-T3 `CustomerPicker`, `BalanceLine`, `MoneyText` | DSYS | Components |
| P2-T4 QA tests for customer flows | QA | E2E-02..E2E-04 |

Exit criteria:
- [ ] Add, edit, search (name and phone), deactivate and reactivate work end to end.
- [ ] Duplicate phone shows the warning and allows proceeding; nothing is merged.
- [ ] Invalid phone is rejected with the exact copy.
- [ ] Alert step of 0 or negative is rejected in UI and DB.

### Phase 3: Ledger (udhaar, payments, reversals)

| Task | Owner | Output |
|------|-------|--------|
| P3-T1 `createTransactionAction`, `reverseTransactionAction`, `getLedger` | API | Real, with idempotency and error mapping |
| P3-T2 `LedgerList`, `LedgerRow` (margin rule, running balance, reversal display), `AmountField`, `NoteChips` | DSYS | Components |
| P3-T3 Entry screen, ResultSheet, ReverseSheet, advance ConfirmSheet, customer details ledger with pagination | UI | Screens |
| P3-T4 QA: balance math, idempotency, advance, reversal, network failure | QA | DB-*, E2E-05..E2E-10 |

Exit criteria:
- [ ] Balance always equals SUM(CREDIT) − SUM(PAYMENT) including reversals (property test on random sequences).
- [ ] Double-tap on Save creates exactly one row. Retry after a simulated network failure with the same key creates one row.
- [ ] Payment above balance requires confirmation and displays as Advance.
- [ ] Udhaar to an inactive customer is blocked in UI and DB.
- [ ] A reversed entry is visibly marked; a second reversal attempt is rejected.
- [ ] A timed run of "pick customer, type 50, tap Chai, save" is recorded at 15 seconds or less on a mid-range Android profile in Playwright (mobile emulation) with a note of the step count.

### Phase 4: Alerts, reminders, dashboard, settings

| Task | Owner | Output |
|------|-------|--------|
| P4-T1 `getDashboard`, `getReminderDraft`, `getSettings`, `updateSettingsAction` | API | Real |
| P4-T2 Dashboard screen (needs-a-reminder list, today, totals, recent), ReminderSheet, alert block in ResultSheet | UI | Screens |
| P4-T3 Settings screen with template preview and validation | UI | Screen |
| P4-T4 QA: alert crossing matrix, reminder content, WhatsApp URL | QA | AL-*, WA-*, E2E-11..E2E-14 |

Exit criteria:
- [ ] Alert crossing matches D-05 for every case in AL-01..AL-08.
- [ ] Reminder text contains the correct saved name and current balance at generation time.
- [ ] The WhatsApp link targets `wa.me/91XXXXXXXXXX` with the encoded text; invalid phone blocks the link with the specified message.
- [ ] No UI string says a reminder was "sent".
- [ ] Dashboard totals match a hand-calculated seed scenario including an inactive customer with a balance and an advance.

### Phase 5: Hardening and design gate

| Task | Owner | Output |
|------|-------|--------|
| P5-T1 Remove `src/lib/fixtures/**` and every `CHAI_FIXTURES` reference | API | grep clean |
| P5-T2 Full regression, responsive pass at 320, 360, 412, 768, 1280 px, keyboard-only pass, 200% zoom | QA | Report |
| P5-T3 Design gate review using `docs/design/review-checklist.md` (section 9.3) with screenshots saved under `tests/visual/` | QA | Pass or fix requests |
| P5-T4 Fix all S1/S2 and agreed S3 | owners | Closed bugs |
| P5-T5 Security review: no service-role key, no direct client writes to `transactions`, server-side ownership checks, headers present | QA | Checklist signed in a handoff |

Exit criteria:
- [ ] Zero open S1/S2 bugs. `grep -R "CHAI_FIXTURES\|fixtures" src` returns nothing.
- [ ] Every acceptance criterion in section 9.4 passes.
- [ ] Design gate passes with no banned pattern from 7.3.

### Phase 6: Deployment and trial

| Task | Owner | Output |
|------|-------|--------|
| P6-T1 Create production Supabase project (Mumbai region), apply migrations, create the owner user, confirm signup is disabled | OPS | Prod DB |
| P6-T2 Vercel project, set the three env vars, HTTPS, production deploy | OPS | Live URL |
| P6-T3 Backups: read the current Supabase plan documentation for backup and point-in-time options, enable what the plan provides, and write `docs/ops/backup-restore.md` with a tested restore drill. If the plan offers no automatic backup, schedule a periodic `pg_dump` to private storage and document it | OPS | Documented, drilled |
| P6-T4 Smoke test on the live site from a real Android phone and a laptop: login, add customer, udhaar, payment, reversal, WhatsApp link | QA | Report |
| P6-T5 Trial with a small set of real records for one week; QA collects issues | QA, ORCH | Trial notes |

Exit criteria:
- [ ] Same data visible from phone and laptop.
- [ ] Restore drill completed once and recorded.
- [ ] Owner sign-off recorded in `STATE.md`.

---

## 9. Test matrix (owner `QA`, authors named per row)

### 9.1 Unit (Vitest)

| ID | Case |
|----|------|
| M-01 | `parseAmountToPaise("50")` is 5000; `"50.5"` is 5050; `"₹1,250.25"` is 125025 |
| M-02 | Rejects `"0"`, `"-5"`, `"abc"`, `"1.234"`, `"100000.01"`, `""` |
| M-03 | `formatINR("100000.00")` is `₹1,00,000`; `"1250.50"` is `₹1,250.50`; `"-200.00"` keeps the minus |
| PH-01 | `9876543210`, `09876543210`, `919876543210`, `+91 98765-43210`, `0091 98765 43210` all normalize to `919876543210` |
| PH-02 | `5876543210`, `98765`, `98765432101`, `abcdefghij`, empty return `null` |
| WA-01 | URL is `https://wa.me/919876543210?text=` plus the encoded message; emoji and newlines are encoded |
| WA-02 | Invalid stored phone throws `INVALID_PHONE` |
| RM-01 | Placeholders render with the saved name and `1,250`; unknown placeholders untouched; settings rejects a template missing `{amount}` |
| IST-01 | An instant at 18:31 UTC on 3 Nov is "Yesterday" or "Today" correctly per IST midnight rollover (test at 18:29 and 18:31 UTC) |

### 9.2 Database, alerts, RLS (pgTAP, plus API-level where needed)

| ID | Case |
|----|------|
| DB-01 | Amount 0, negative, over 100000, or 3 decimals is rejected |
| DB-02 | Phone not matching `^91[6-9][0-9]{9}$` is rejected on customers and profiles |
| DB-03 | `alert_step` 0 or negative is rejected |
| DB-04 | Direct `update` or `delete` on `transactions` raises `TRANSACTIONS_IMMUTABLE` |
| DB-05 | Direct `insert` into `transactions` as an authenticated user is denied |
| DB-06 | Customer with no transactions has balance 0, status `CLEAR` |
| DB-07 | Credit 500 then payment 200 gives balance 300 |
| DB-08 | Payment greater than balance without confirm raises `ADVANCE_CONFIRMATION_REQUIRED` with details; with confirm, balance is negative, `advance_confirmed` is true, status `ADVANCE` |
| DB-09 | Same idempotency key twice yields one row and `replayed: true` |
| DB-10 | Credit to an inactive customer raises `CUSTOMER_INACTIVE`; payment to inactive succeeds |
| DB-11 | Reversal of credit creates an opposite PAYMENT row linked via `reversal_of`; balance returns to prior value; original shows `is_reversed` |
| DB-12 | Second reversal raises `ALREADY_REVERSED`; reversing a reversal raises `CANNOT_REVERSE_REVERSAL` |
| DB-13 | Reason shorter than 3 characters is rejected |
| DB-14 | `transactions.owner_id` must match the customer's owner (composite FK) |
| DB-15 | `dashboard_summary` excludes reversed entries and reversal rows from today's totals, includes inactive balances in `total_outstanding`, reports advances separately |
| DB-16 | Two concurrent `create_transaction` calls for one customer serialize (no lost update; balance correct) |
| AL-01 | Step 500: balance 0 to 400 gives no alert |
| AL-02 | 400 to 500 gives alert level 1, crossed amount 500 |
| AL-03 | 500 to 900 gives no alert |
| AL-04 | 900 to 1100 gives alert level 2, crossed amount 1000 |
| AL-05 | One credit jumping 0 to 1600 gives alert level 3, crossed amount 1500 (single alert) |
| AL-06 | 1100 down to 400 by payment, then up to 600 by credit gives alert level 1 again |
| AL-07 | Payments and reversals never produce an alert |
| AL-08 | Editing a customer's alert step changes future alerts only; no alert on edit |
| RLS-01 | Anonymous role cannot select any table, view or call any RPC |
| RLS-02 | User B cannot select, update or insert customers owned by user A |
| RLS-03 | User B cannot read A's transactions, ledger or balances |
| RLS-04 | User B calling `create_transaction` with A's customer id gets `CUSTOMER_NOT_FOUND` |
| RLS-05 | User B calling `reverse_transaction` with A's transaction id gets `TRANSACTION_NOT_FOUND` |
| RLS-06 | A client-supplied `owner_id` on customer insert that differs from the session user is rejected |

### 9.3 End-to-end (Playwright) and design gate

| ID | Case |
|----|------|
| E2E-01 | Protected routes redirect to login; logout clears access; refresh keeps the session |
| E2E-02 | Add customer, appears in list, searchable by name and by phone digits |
| E2E-03 | Duplicate phone warning appears and "Save anyway" works; "Change number" returns to the form |
| E2E-04 | Deactivate customer: hidden from Active, visible under Inactive, udhaar blocked, payment allowed |
| E2E-05 | Fast entry: pick customer, 50, Chai, save; result sheet shows new balance |
| E2E-06 | Double-click Save creates one entry |
| E2E-07 | Offline or failed request: error shown, form values kept, no success shown; retry saves once |
| E2E-08 | Payment above balance shows ConfirmSheet; "Save as advance" shows Advance; "Change amount" returns to the form |
| E2E-09 | Reverse an entry from the ledger with a reason; original struck and marked; balance restored |
| E2E-10 | Ledger pagination loads older entries; running balance stays consistent across pages |
| E2E-11 | Crossing 500 shows the alert block in the result sheet; the dashboard lists the customer under Needs a reminder |
| E2E-12 | ReminderSheet message contains the saved name and current balance; edited text appears in the `wa.me` href |
| E2E-13 | Customer with invalid phone or zero balance cannot generate a reminder; the specific reason is shown |
| E2E-14 | Dashboard totals match the seeded scenario |
| E2E-15 | Layouts at 320, 360, 412, 768, 1280 px have no horizontal scroll; bottom bar does not cover content |
| E2E-16 | Keyboard-only completion of an udhaar entry; focus ring visible; sheets trap and restore focus |

**Design gate (`docs/design/review-checklist.md`, QA answers each yes or no with a screenshot):**

1. Does the customer ledger show the double margin rule, hairline rows and running balance?
2. Are lists ruled rows rather than identical cards?
3. Is there any gradient, glass, blur or decorative shadow?
4. Is any label ALL CAPS, tracked out, numbered, or an eyebrow above a heading?
5. Is any heading using a single accented word?
6. Are owed, paid and alert states communicated with words or signs as well as color?
7. Is a single type family (Atkinson Hyperlegible, 400 and 700) used with tabular numerals on all money?
8. Do all three radii appear only in their roles (chip 6, control 10, sheet 20) with none on ledger rows?
9. Is any shadcn default look (zinc palette, default Card, uniform `rounded-xl`) visible?
10. Is there motion other than sheet slide, press feedback and balance replacement?
11. Does all copy match 7.8 and sentence case rules, with no "Oops", "Welcome back", "Submit"?
12. Are touch targets at least 48px and amounts right aligned?
Any "yes" on 3, 4, 5, 9, 10 or any "no" elsewhere is a failure and returns to `DSYS` or `UI` as an S2 bug.

### 9.4 MVP acceptance criteria (all must pass at Phase 5 exit)

- [ ] Owner can log in, stay logged in, and log out; unauthenticated users cannot reach private data.
- [ ] Owner can add, edit, search and deactivate customers; duplicates only warn.
- [ ] Owner can add udhaar and record payments; balances equal SUM(CREDIT) − SUM(PAYMENT).
- [ ] Customer history is accurate, chronological and readable on a phone.
- [ ] Alert step per customer is editable; alerts fire exactly per D-05 and are shown after saving and on the dashboard.
- [ ] Reminder text has the correct name and balance; WhatsApp opens the correct chat prefilled; the owner must press Send; the app never claims it was sent.
- [ ] Advance payments need confirmation and display as Advance.
- [ ] Wrong entries are corrected only by linked reversal; no edit or delete exists.
- [ ] Retries and double-taps never create duplicate entries; failures never show success.
- [ ] RLS blocks all cross-owner access; public signup is off; no service-role key in code.
- [ ] Same data on phone and laptop; all times in IST.

---

## 10. Deployment notes (owner `OPS`)

- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Nothing else.
- Supabase auth URL configuration: Site URL and redirect allow-list contain only the production URL (and `http://localhost:3000` for development).
- Run migrations in order against production before the first deploy. Verify with `select * from pg_policies where schemaname = 'public'` that every table has RLS enabled and the expected policies.
- Verify the grants in 5.5 on production (`anon` has no table or function access).
- `docs/ops/release-checklist.md` lists: signup disabled, owner created, HTTPS, headers, backups verified, restore drill done, smoke test passed.

---

## 11. Documented defaults and open items

These were not explicitly decided by the owner. Agents use the default and keep it easy to change.

| Item | Default used |
|------|--------------|
| Maximum single entry | ₹1,00,000 (database constraint and zod) |
| Ledger page size | 50 entries |
| Picker and list cap | 500 customers |
| Alert on idempotent replay | `null` (alert is shown only on the first successful save) |
| Alerts for reversals and payments | Never |
| Reversal time window | None (any entry can be reversed once) |
| Reminder template and shop name | The default template in section 1; both editable in Settings |
| Owner phone | Optional, stored for reference only |
| UI language | English with Hinglish nouns (Udhaar), reminder text in Hinglish |
| Dark mode, PWA, exports | Not in MVP |
| Reminder history | Not stored (the app cannot know if the message was sent) |

Open for the owner (does not block any phase): final shop name text and the final reminder wording.

---

## Appendix A: Handoff template

```
# Handoff <phase>-<from>-to-<to>-<slug>
Type: DELIVERY | REQUEST | QUESTION | CONTRACT_CHANGE
From: <agent>   To: <agent>   Phase: <n>   Date: <YYYY-MM-DD>

## What is delivered or needed
## Files touched (paths)
## Contract impact (none, or list changed types/functions)
## How to verify (exact commands and expected output)
## Known limits
## Blocking question (QUESTION only) and the default I will use if unanswered
```

## Appendix B: Bug report template

```
# BUG-<nnn>: <short title>
Severity: S1 | S2 | S3     Found by: QA     Owner: <agent>     Status: open | fixed | verified | deferred
Steps to reproduce (numbered, exact inputs)
Expected (cite spec section or test ID)
Actual
Evidence (screenshot path, log, SQL)
Fix notes (owner)
Regression test added (path)
Loop count: <n of 3>
```

## Appendix C: `STATE.md` skeleton (owned by `ORCH`)

```
# Chai Ledger state
Current phase: <n>
| Phase | Status (not started / in progress / gate review / closed) | Gate approved on |
Open handoffs: <list>
Open bugs: <list with severity>
Deferred S3s: <list>
Decisions made by ORCH: <date, decision, reason>
Owner sign-off: <date or pending>
```
