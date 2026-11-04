-- Migration 0001: Schema, Types, Tables, Triggers
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Section 5.1

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
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ledger immutability: no update, no delete
create function public.block_transaction_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'TRANSACTIONS_IMMUTABLE' using errcode = 'P0001';
end $$;

create trigger transactions_no_mutation
  before update or delete on public.transactions
  for each row execute function public.block_transaction_mutation();

-- reversal integrity (defence in depth; the RPC also checks)
create function public.validate_reversal() returns trigger
language plpgsql set search_path = '' as $$
declare
  o public.transactions%rowtype;
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

create trigger transactions_validate_reversal
  before insert on public.transactions
  for each row execute function public.validate_reversal();

-- profile row for the owner account
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
