-- Chai Ledger Row Level Security (RLS) Test Suite (pgTAP)
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 5.2, 5.5, 9.2 (RLS-01..RLS-06)

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(20);

-- Setup: Create two distinct users in auth.users and profiles
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_a@chailedger.test', '$2a$10$w3bYF/3b/b1sQfCszZ4QOeFHz6q7E0m/lT5v7a8.5fIe1bX3pWlsq', now(), now(), now()),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_b@chailedger.test', '$2a$10$w3bYF/3b/b1sQfCszZ4QOeFHz6q7E0m/lT5v7a8.5fIe1bX3pWlsq', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, shop_name, owner_name, phone, default_alert_step)
values
  ('70000000-0000-0000-0000-000000000001', 'Shop User A', 'Owner A', '919876543210', 500.00),
  ('70000000-0000-0000-0000-000000000002', 'Shop User B', 'Owner B', '919876543211', 500.00)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  owner_name = excluded.owner_name,
  phone = excluded.phone,
  default_alert_step = excluded.default_alert_step;

-- Setup User A customer and transaction
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'User A Customer', '919876543212', 500.00, true);

insert into public.transactions (
  id, owner_id, customer_id, type, amount, description, idempotency_key
) values (
  '90000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  'CREDIT',
  75.00,
  'User A confidential transaction',
  gen_random_uuid()
);

-- -----------------------------------------------------------------------------
-- 0. Verify RLS is enabled on all tables
-- -----------------------------------------------------------------------------
select is(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'profiles'),
  true,
  'RLS is enabled on public.profiles'
);

select is(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'customers'),
  true,
  'RLS is enabled on public.customers'
);

select is(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'transactions'),
  true,
  'RLS is enabled on public.transactions'
);

-- -----------------------------------------------------------------------------
-- RLS-01: Anonymous role cannot select any table, view or call any RPC
-- -----------------------------------------------------------------------------
set local role anon;
set local "request.jwt.claim.sub" = '';
set local "request.jwt.claims" = '{"role": "anon"}';

select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot select profiles'
);

select throws_ok(
  $$select * from public.customers$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot select customers'
);

select throws_ok(
  $$select * from public.transactions$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot select transactions'
);

select throws_ok(
  $$select * from public.customer_balances$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot select customer_balances'
);

select throws_ok(
  $$select * from public.transaction_ledger$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot select transaction_ledger'
);

select throws_ok(
  $$select public.create_transaction('80000000-0000-0000-0000-000000000001', 'CREDIT', 50.00, 'Test', gen_random_uuid())$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot execute create_transaction'
);

select throws_ok(
  $$select public.reverse_transaction(gen_random_uuid(), 'Reversal reason', gen_random_uuid())$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot execute reverse_transaction'
);

select throws_ok(
  $$select public.dashboard_summary()$$,
  '42501',
  null,
  'RLS-01: Anonymous role cannot execute dashboard_summary'
);

-- -----------------------------------------------------------------------------
-- RLS-02: User B cannot select, update or insert customers owned by User A
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claim.sub" = '70000000-0000-0000-0000-000000000002';
set local "request.jwt.claims" = '{"sub": "70000000-0000-0000-0000-000000000002", "role": "authenticated"}';

select is(
  (select count(*)::int from public.customers where id = '80000000-0000-0000-0000-000000000001'),
  0,
  'RLS-02: User B cannot select customers owned by User A'
);

-- Updating a customer owned by another user updates 0 rows
select is(
  (with u as (
    update public.customers set name = 'Hacked by User B'
    where id = '80000000-0000-0000-0000-000000000001'
    returning 1
  ) select count(*)::int from u),
  0,
  'RLS-02: User B cannot update customers owned by User A'
);

-- User B attempting to insert customer with User A's owner_id
select throws_ok(
  $$insert into public.customers (id, owner_id, name, phone)
    values (gen_random_uuid(), '70000000-0000-0000-0000-000000000001', 'Injected Customer', '919876543299')$$,
  '42501',
  null,
  'RLS-02: User B inserting customer with User A owner_id rejected by customers_insert_own check'
);

-- -----------------------------------------------------------------------------
-- RLS-03: User B cannot read User A transactions, ledger or balances
-- -----------------------------------------------------------------------------
select is(
  (select count(*)::int from public.transactions where owner_id = '70000000-0000-0000-0000-000000000001'),
  0,
  'RLS-03: User B cannot select User A transactions'
);

select is(
  (select count(*)::int from public.customer_balances where owner_id = '70000000-0000-0000-0000-000000000001'),
  0,
  'RLS-03: User B cannot select User A customer balances'
);

select is(
  (select count(*)::int from public.transaction_ledger where owner_id = '70000000-0000-0000-0000-000000000001'),
  0,
  'RLS-03: User B cannot select User A transaction ledger'
);

-- -----------------------------------------------------------------------------
-- RLS-04: User B calling create_transaction on User A customer gets CUSTOMER_NOT_FOUND
-- -----------------------------------------------------------------------------
select throws_ok(
  $$select public.create_transaction('80000000-0000-0000-0000-000000000001', 'CREDIT', 100.00, 'Cross-user attempt', gen_random_uuid())$$,
  'CUSTOMER_NOT_FOUND',
  'RLS-04: User B calling create_transaction on User A customer raises CUSTOMER_NOT_FOUND'
);

-- -----------------------------------------------------------------------------
-- RLS-05: User B calling reverse_transaction on User A transaction gets TRANSACTION_NOT_FOUND
-- -----------------------------------------------------------------------------
select throws_ok(
  $$select public.reverse_transaction('90000000-0000-0000-0000-000000000001', 'Malicious reversal', gen_random_uuid())$$,
  'TRANSACTION_NOT_FOUND',
  'RLS-05: User B calling reverse_transaction on User A transaction raises TRANSACTION_NOT_FOUND'
);

-- -----------------------------------------------------------------------------
-- RLS-06: Client-supplied owner_id differing from auth.uid() rejected on insert
-- -----------------------------------------------------------------------------
-- Switch session to User A
set local "request.jwt.claim.sub" = '70000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "70000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$insert into public.customers (owner_id, name, phone)
    values ('70000000-0000-0000-0000-000000000002', 'Spoofed Customer', '919876543298')$$,
  '42501',
  null,
  'RLS-06: Customer insert with owner_id differing from auth.uid() rejected by with check policy'
);

select * from finish();
rollback;
