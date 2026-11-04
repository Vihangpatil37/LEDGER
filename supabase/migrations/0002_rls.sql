-- Migration 0002: Row Level Security
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Section 5.2

alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.transactions enable row level security;

-- profiles policies
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- customers policies
create policy customers_select_own on public.customers for select to authenticated
  using (owner_id = (select auth.uid()));

create policy customers_insert_own on public.customers for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy customers_update_own on public.customers for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
-- Note: no delete policy on customers (customers can be deactivated, never deleted)

-- transactions policies
create policy transactions_select_own on public.transactions for select to authenticated
  using (owner_id = (select auth.uid()));
-- Note: no insert/update/delete policy on transactions: writes happen only through security definer RPCs
