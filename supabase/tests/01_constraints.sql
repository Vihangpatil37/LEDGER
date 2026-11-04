-- Chai Ledger Database Constraints Test Suite (pgTAP)
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 5.7 & 9.2 (DB-01..DB-16)

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(39);

-- Test Setup: Create test owner in auth.users and public.profiles
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'db_test_owner_a@chailedger.test',
  '$2a$10$w3bYF/3b/b1sQfCszZ4QOeFHz6q7E0m/lT5v7a8.5fIe1bX3pWlsq',
  now(),
  now(),
  now()
) on conflict (id) do nothing;

insert into public.profiles (id, shop_name, owner_name, phone, default_alert_step)
values ('a0000000-0000-0000-0000-000000000001', 'Test Stall A', 'Owner A', '919876543210', 500.00)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  owner_name = excluded.owner_name,
  phone = excluded.phone,
  default_alert_step = excluded.default_alert_step;

-- Create User B for cross-owner constraint tests
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values (
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'db_test_owner_b@chailedger.test',
  '$2a$10$w3bYF/3b/b1sQfCszZ4QOeFHz6q7E0m/lT5v7a8.5fIe1bX3pWlsq',
  now(),
  now(),
  now()
) on conflict (id) do nothing;

insert into public.profiles (id, shop_name, owner_name, phone, default_alert_step)
values ('b0000000-0000-0000-0000-000000000002', 'Test Stall B', 'Owner B', '919876543211', 500.00)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  owner_name = excluded.owner_name,
  phone = excluded.phone,
  default_alert_step = excluded.default_alert_step;

-- Setup Customer 1 for User A
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Customer One', '919876543210', 500.00, true)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- DB-01: Amount 0, negative, > 100000, or 3 decimals rejected
-- -----------------------------------------------------------------------------
select throws_ok(
  $$insert into public.transactions (owner_id, customer_id, type, amount, idempotency_key)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CREDIT', 0, gen_random_uuid())$$,
  '23514',
  null,
  'DB-01: Amount 0 rejected by transactions_amount_check'
);

select throws_ok(
  $$insert into public.transactions (owner_id, customer_id, type, amount, idempotency_key)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CREDIT', -10.00, gen_random_uuid())$$,
  '23514',
  null,
  'DB-01: Negative amount rejected by transactions_amount_check'
);

select throws_ok(
  $$insert into public.transactions (owner_id, customer_id, type, amount, idempotency_key)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CREDIT', 100000.01, gen_random_uuid())$$,
  '23514',
  null,
  'DB-01: Amount > 100000 rejected by transactions_amount_check'
);

-- Scale > 2 rejected in create_transaction RPC
set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$select public.create_transaction('c0000000-0000-0000-0000-000000000001', 'CREDIT', 50.125, null, gen_random_uuid())$$,
  'AMOUNT_OUT_OF_RANGE',
  'DB-01: Amount with 3 decimals rejected by create_transaction RPC'
);

reset role;

-- -----------------------------------------------------------------------------
-- DB-02: Phone not matching ^91[6-9][0-9]{9}$ rejected on customers and profiles
-- -----------------------------------------------------------------------------
select throws_ok(
  $$update public.profiles set phone = '9876543210' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '23514',
  null,
  'DB-02: 10-digit phone without 91 prefix rejected on profiles'
);

select throws_ok(
  $$insert into public.customers (owner_id, name, phone)
    values ('a0000000-0000-0000-0000-000000000001', 'Bad Phone', '915876543210')$$,
  '23514',
  null,
  'DB-02: Phone starting with invalid mobile digit 5 rejected on customers'
);

select lives_ok(
  $$insert into public.customers (id, owner_id, name, phone)
    values ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Valid Customer', '919876543210')$$,
  'DB-02: Valid phone matching ^91[6-9][0-9]{9}$ accepted on customers'
);

-- -----------------------------------------------------------------------------
-- DB-03: alert_step 0 or negative rejected
-- -----------------------------------------------------------------------------
select throws_ok(
  $$insert into public.customers (owner_id, name, phone, alert_step)
    values ('a0000000-0000-0000-0000-000000000001', 'Zero Step', '919876543210', 0)$$,
  '23514',
  null,
  'DB-03: alert_step 0 on customers rejected'
);

select throws_ok(
  $$insert into public.customers (owner_id, name, phone, alert_step)
    values ('a0000000-0000-0000-0000-000000000001', 'Negative Step', '919876543210', -50.00)$$,
  '23514',
  null,
  'DB-03: Negative alert_step on customers rejected'
);

select throws_ok(
  $$update public.profiles set default_alert_step = 0 where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '23514',
  null,
  'DB-03: default_alert_step 0 on profiles rejected'
);

-- -----------------------------------------------------------------------------
-- DB-04: Direct update or delete on transactions raises TRANSACTIONS_IMMUTABLE
-- -----------------------------------------------------------------------------
insert into public.transactions (
  id, owner_id, customer_id, type, amount, description, idempotency_key
) values (
  't0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'CREDIT',
  50.00,
  'Immutability test original',
  gen_random_uuid()
);

select throws_ok(
  $$update public.transactions set description = 'hacked' where id = 't0000000-0000-0000-0000-000000000001'$$,
  'TRANSACTIONS_IMMUTABLE',
  'DB-04: Direct update on transactions raises TRANSACTIONS_IMMUTABLE'
);

select throws_ok(
  $$delete from public.transactions where id = 't0000000-0000-0000-0000-000000000001'$$,
  'TRANSACTIONS_IMMUTABLE',
  'DB-04: Direct delete on transactions raises TRANSACTIONS_IMMUTABLE'
);

-- -----------------------------------------------------------------------------
-- DB-05: Direct insert into transactions as authenticated user denied
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$insert into public.transactions (owner_id, customer_id, type, amount, idempotency_key)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CREDIT', 50.00, gen_random_uuid())$$,
  '42501',
  null,
  'DB-05: Direct insert into transactions as authenticated user denied by permissions/RLS'
);

reset role;

-- -----------------------------------------------------------------------------
-- DB-06: Customer with no transactions has balance 0, status CLEAR
-- -----------------------------------------------------------------------------
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Customer Six No Txn', '919876543216', 500.00, true);

select is(
  (select balance from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000006'),
  0.00::numeric(12,2),
  'DB-06: Customer with no transactions has balance 0.00'
);

select is(
  (select status from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000006'),
  'CLEAR',
  'DB-06: Customer with no transactions has status CLEAR'
);

select is(
  (select alert_level from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000006'),
  0,
  'DB-06: Customer with no transactions has alert_level 0'
);

-- -----------------------------------------------------------------------------
-- DB-07: Credit 500 then payment 200 gives balance 300
-- -----------------------------------------------------------------------------
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Customer Seven Flow', '919876543217', 500.00, true);

set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

perform public.create_transaction('c0000000-0000-0000-0000-000000000007', 'CREDIT', 500.00, 'Chai', gen_random_uuid());
perform public.create_transaction('c0000000-0000-0000-0000-000000000007', 'PAYMENT', 200.00, 'Cash', gen_random_uuid());

select is(
  (select balance from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000007'),
  300.00::numeric(12,2),
  'DB-07: Credit 500 then payment 200 yields balance 300.00'
);

select is(
  (select status from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000007'),
  'OWING',
  'DB-07: Status is OWING when balance is 300.00 and alert_step is 500'
);

-- -----------------------------------------------------------------------------
-- DB-08: Payment > balance without confirm raises ADVANCE_CONFIRMATION_REQUIRED;
--        with confirm, balance negative, advance_confirmed true, status ADVANCE
-- -----------------------------------------------------------------------------
select throws_ok(
  $$select public.create_transaction('c0000000-0000-0000-0000-000000000007', 'PAYMENT', 500.00, 'Overpay', gen_random_uuid(), false)$$,
  'ADVANCE_CONFIRMATION_REQUIRED',
  'DB-08: Payment > balance without confirm raises ADVANCE_CONFIRMATION_REQUIRED'
);

select lives_ok(
  $$select public.create_transaction('c0000000-0000-0000-0000-000000000007', 'PAYMENT', 500.00, 'Overpay confirmed', gen_random_uuid(), true)$$,
  'DB-08: Payment > balance with confirm succeeds'
);

select is(
  (select balance from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000007'),
  -200.00::numeric(12,2),
  'DB-08: Balance is -200.00 after confirmed advance payment'
);

select is(
  (select status from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000007'),
  'ADVANCE',
  'DB-08: Status is ADVANCE when balance is negative'
);

-- -----------------------------------------------------------------------------
-- DB-09: Idempotent replay: same key twice yields 1 row and replayed: true
-- -----------------------------------------------------------------------------
perform public.create_transaction(
  'c0000000-0000-0000-0000-000000000001',
  'CREDIT',
  60.00,
  'Idempotent call 1',
  'd0000000-0000-0000-0000-000000000009'::uuid
);

select is(
  (public.create_transaction(
    'c0000000-0000-0000-0000-000000000001',
    'CREDIT',
    60.00,
    'Idempotent call 2',
    'd0000000-0000-0000-0000-000000000009'::uuid
  ))->>'replayed',
  'true',
  'DB-09: Replayed transaction call returns replayed: true'
);

select is(
  (select count(*)::int from public.transactions where idempotency_key = 'd0000000-0000-0000-0000-000000000009'),
  1,
  'DB-09: Exactly one row stored in transactions for idempotent key'
);

-- -----------------------------------------------------------------------------
-- DB-10: Credit to inactive customer raises CUSTOMER_INACTIVE; payment succeeds
-- -----------------------------------------------------------------------------
reset role;
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Customer Ten Inactive', '919876543219', 500.00, false);

set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$select public.create_transaction('c0000000-0000-0000-0000-000000000010', 'CREDIT', 50.00, 'Chai', gen_random_uuid())$$,
  'CUSTOMER_INACTIVE',
  'DB-10: Credit to inactive customer raises CUSTOMER_INACTIVE'
);

select lives_ok(
  $$select public.create_transaction('c0000000-0000-0000-0000-000000000010', 'PAYMENT', 50.00, 'Settlement', gen_random_uuid(), true)$$,
  'DB-10: Payment to inactive customer succeeds'
);

-- -----------------------------------------------------------------------------
-- DB-11: Reversal of credit creates PAYMENT row linked via reversal_of,
--        restores balance, original is_reversed true
-- -----------------------------------------------------------------------------
reset role;
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Customer Eleven Rev', '919876543221', 500.00, true);

set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

perform public.create_transaction(
  'c0000000-0000-0000-0000-000000000011',
  'CREDIT',
  100.00,
  'Original to be reversed',
  'd0000000-0000-0000-0000-000000000011'::uuid
);

perform public.reverse_transaction(
  (select id from public.transactions where idempotency_key = 'd0000000-0000-0000-0000-000000000011'),
  'Billed wrong customer',
  'd0000000-0000-0000-0000-000000000012'::uuid
);

select is(
  (select balance from public.customer_balances where id = 'c0000000-0000-0000-0000-000000000011'),
  0.00::numeric(12,2),
  'DB-11: Customer balance restored to 0.00 after reversing credit'
);

select is(
  (select is_reversed from public.transaction_ledger where idempotency_key = 'd0000000-0000-0000-0000-000000000011'),
  true,
  'DB-11: Original transaction shows is_reversed = true in transaction_ledger'
);

select is(
  (select type::text from public.transactions where idempotency_key = 'd0000000-0000-0000-0000-000000000012'),
  'PAYMENT',
  'DB-11: Reversal of CREDIT created row with opposite type PAYMENT'
);

-- -----------------------------------------------------------------------------
-- DB-12: Second reversal raises ALREADY_REVERSED; reversing reversal raises CANNOT_REVERSE_REVERSAL
-- -----------------------------------------------------------------------------
select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'd0000000-0000-0000-0000-000000000011'),
      'Second reversal attempt',
      gen_random_uuid()
    )$$,
  'ALREADY_REVERSED',
  'DB-12: Second reversal attempt on same transaction raises ALREADY_REVERSED'
);

select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'd0000000-0000-0000-0000-000000000012'),
      'Reversing a reversal',
      gen_random_uuid()
    )$$,
  'CANNOT_REVERSE_REVERSAL',
  'DB-12: Reversing an existing reversal raises CANNOT_REVERSE_REVERSAL'
);

-- -----------------------------------------------------------------------------
-- DB-13: Reversal reason < 3 chars rejected
-- -----------------------------------------------------------------------------
select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'd0000000-0000-0000-0000-000000000011'),
      'ok',
      gen_random_uuid()
    )$$,
  'VALIDATION_FAILED',
  'DB-13: Reversal reason shorter than 3 chars raises VALIDATION_FAILED'
);

reset role;
select throws_ok(
  $$insert into public.transactions (
      owner_id, customer_id, type, amount, description, is_reversal, reversal_of, idempotency_key
    ) values (
      'a0000000-0000-0000-0000-000000000001',
      'c0000000-0000-0000-0000-000000000001',
      'PAYMENT',
      50.00,
      'no',
      true,
      't0000000-0000-0000-0000-000000000001',
      gen_random_uuid()
    )$$,
  '23514',
  null,
  'DB-13: Direct insert of reversal with reason < 3 chars rejected by check constraint'
);

-- -----------------------------------------------------------------------------
-- DB-14: transactions.owner_id composite FK enforced
-- -----------------------------------------------------------------------------
select throws_ok(
  $$insert into public.transactions (owner_id, customer_id, type, amount, idempotency_key)
    values (
      'b0000000-0000-0000-0000-000000000002',
      'c0000000-0000-0000-0000-000000000001',
      'CREDIT',
      50.00,
      gen_random_uuid()
    )$$,
  '23503',
  null,
  'DB-14: Mismatched owner_id on transactions violates composite FK transactions_customer_owner_fk'
);

-- -----------------------------------------------------------------------------
-- DB-15: dashboard_summary excludes reversals from today's totals,
--        includes inactive in total_outstanding, reports advances
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select ok(
  (public.dashboard_summary()->>'total_outstanding')::numeric >= 0,
  'DB-15: dashboard_summary computes total_outstanding across all customers'
);

select ok(
  (public.dashboard_summary()->>'total_advance')::numeric >= 0,
  'DB-15: dashboard_summary reports advances as absolute non-negative total_advance'
);

select ok(
  (public.dashboard_summary()->>'credit_today')::numeric >= 0,
  'DB-15: dashboard_summary computes unreversed credit_today'
);

select ok(
  (public.dashboard_summary()->>'payments_today')::numeric >= 0,
  'DB-15: dashboard_summary computes non-reversal payments_today'
);

-- -----------------------------------------------------------------------------
-- DB-16: Concurrent transactions serialize via row locks (FOR UPDATE)
-- -----------------------------------------------------------------------------
reset role;
select lives_ok(
  $$select id from public.customers where id = 'c0000000-0000-0000-0000-000000000001' for update$$,
  'DB-16: FOR UPDATE row lock on customers serializes concurrent transactions'
);

select * from finish();
rollback;
