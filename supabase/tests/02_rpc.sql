-- Chai Ledger RPC Functions & Alert Matrix Test Suite (pgTAP)
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 5.4, 5.7, 9.2 (AL-01..AL-08, DB-*)

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(41);

-- Setup: Create test owner in auth.users and profiles
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values (
  'e0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'rpc_test_owner@chailedger.test',
  '$2a$10$w3bYF/3b/b1sQfCszZ4QOeFHz6q7E0m/lT5v7a8.5fIe1bX3pWlsq',
  now(),
  now(),
  now()
) on conflict (id) do nothing;

insert into public.profiles (id, shop_name, owner_name, phone, default_alert_step)
values ('e0000000-0000-0000-0000-000000000001', 'RPC Test Stall', 'RPC Owner', '919876543210', 500.00)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  owner_name = excluded.owner_name,
  phone = excluded.phone,
  default_alert_step = excluded.default_alert_step;

-- Setup test customers
insert into public.customers (id, owner_id, name, phone, alert_step, is_active)
values
  ('e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Customer AL Step 500', '919876543211', 500.00, true),
  ('e1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Customer Jump 1600',   '919876543212', 500.00, true),
  ('e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Customer AL Re-cross', '919876543213', 500.00, true),
  ('e1000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Customer Step Edit',  '919876543214', 500.00, true),
  ('e1000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'Customer Inactive',   '919876543215', 500.00, false);

-- -----------------------------------------------------------------------------
-- 1. Schema & Function Signatures
-- -----------------------------------------------------------------------------
select has_function(
  'public',
  'create_transaction',
  ARRAY['uuid', 'public.txn_type', 'numeric', 'text', 'uuid', 'boolean'],
  'create_transaction function exists with exact signature'
);

select has_function(
  'public',
  'reverse_transaction',
  ARRAY['uuid', 'text', 'uuid'],
  'reverse_transaction function exists with exact signature'
);

select has_function(
  'public',
  'dashboard_summary',
  ARRAY[]::text[],
  'dashboard_summary function exists with 0 arguments'
);

select function_returns(
  'public',
  'create_transaction',
  ARRAY['uuid', 'public.txn_type', 'numeric', 'text', 'uuid', 'boolean'],
  'jsonb',
  'create_transaction returns jsonb'
);

select function_returns(
  'public',
  'reverse_transaction',
  ARRAY['uuid', 'text', 'uuid'],
  'jsonb',
  'reverse_transaction returns jsonb'
);

select function_returns(
  'public',
  'dashboard_summary',
  ARRAY[]::text[],
  'jsonb',
  'dashboard_summary returns jsonb'
);

-- Function security & stability attributes
select is(
  (select prosecdef from pg_proc where proname = 'create_transaction' and pronamespace = 'public'::regnamespace),
  true,
  'create_transaction is security definer'
);

select is(
  (select prosecdef from pg_proc where proname = 'reverse_transaction' and pronamespace = 'public'::regnamespace),
  true,
  'reverse_transaction is security definer'
);

select is(
  (select prosecdef from pg_proc where proname = 'dashboard_summary' and pronamespace = 'public'::regnamespace),
  false,
  'dashboard_summary is security invoker'
);

select is(
  (select provolatile from pg_proc where proname = 'dashboard_summary' and pronamespace = 'public'::regnamespace),
  's',
  'dashboard_summary is stable'
);

-- -----------------------------------------------------------------------------
-- 2. Return Shape & Type Contracts
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claim.sub" = 'e0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "e0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Create transaction shape
select ok(
  (public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 50.00, 'Shape test', 'f0000000-0000-0000-0000-000000000001'::uuid))
    ?& ARRAY['replayed', 'transaction', 'customer', 'balance_before', 'balance_after', 'alert'],
  'create_transaction return JSON contains all required top-level keys'
);

select ok(
  jsonb_typeof((public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 50.00, 'Shape test 2', gen_random_uuid()))->'transaction'->'amount') = 'string'
  and jsonb_typeof((public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 50.00, 'Shape test 3', gen_random_uuid()))->'balance_after') = 'string',
  'create_transaction returns all money amounts as strings ::text'
);

-- Reverse transaction shape
select ok(
  (public.reverse_transaction(
    (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000001'),
    'Test reversal shape',
    'f0000000-0000-0000-0000-000000000002'::uuid
  )) ?& ARRAY['replayed', 'reversal', 'original_id', 'balance_after'],
  'reverse_transaction return JSON contains all required top-level keys'
);

select ok(
  jsonb_typeof((public.reverse_transaction(
    (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000001'),
    'Test reversal shape replay',
    'f0000000-0000-0000-0000-000000000002'::uuid
  ))->'reversal'->'amount') = 'string',
  'reverse_transaction returns money amounts as strings ::text'
);

-- Dashboard summary shape
select ok(
  public.dashboard_summary() ?& ARRAY['total_outstanding', 'total_advance', 'active_customers', 'alert_customers', 'credit_today', 'payments_today'],
  'dashboard_summary return JSON contains all required keys'
);

select ok(
  jsonb_typeof(public.dashboard_summary()->'total_outstanding') = 'string'
  and jsonb_typeof(public.dashboard_summary()->'active_customers') = 'number'
  and jsonb_typeof(public.dashboard_summary()->'credit_today') = 'string',
  'dashboard_summary formats money as strings ::text and customer counts as numbers'
);

-- -----------------------------------------------------------------------------
-- 3. Alert Crossing Matrix (AL-01 .. AL-08)
-- -----------------------------------------------------------------------------
-- AL-01: Step 500: balance 0 to 400 gives no alert
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000004', 'CREDIT', 400.00, '0 to 400', gen_random_uuid()))->>'alert',
  null,
  'AL-01: Step 500: balance 0 to 400 gives no alert'
);

-- AL-02: 400 to 500 gives alert level 1, crossed amount 500
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000004', 'CREDIT', 100.00, '400 to 500', gen_random_uuid()))->'alert',
  jsonb_build_object('level', 1, 'crossed_amount', '500.00'),
  'AL-02: 400 to 500 gives alert level 1, crossed amount 500.00'
);

-- AL-03: 500 to 900 gives no alert
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000004', 'CREDIT', 400.00, '500 to 900', gen_random_uuid()))->>'alert',
  null,
  'AL-03: 500 to 900 gives no alert'
);

-- AL-04: 900 to 1100 gives alert level 2, crossed amount 1000
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000004', 'CREDIT', 200.00, '900 to 1100', gen_random_uuid()))->'alert',
  jsonb_build_object('level', 2, 'crossed_amount', '1000.00'),
  'AL-04: 900 to 1100 gives alert level 2, crossed amount 1000.00'
);

-- AL-05: One credit jumping 0 to 1600 gives alert level 3, crossed amount 1500 (single alert)
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000002', 'CREDIT', 1600.00, '0 to 1600 jump', gen_random_uuid()))->'alert',
  jsonb_build_object('level', 3, 'crossed_amount', '1500.00'),
  'AL-05: One credit jumping 0 to 1600 gives alert level 3, crossed amount 1500.00'
);

-- AL-06: 1100 down to 400 by payment, then up to 600 by credit gives alert level 1 again
-- Customer 3 setup: credit 1100, payment 700 (balance 400), credit 200 (balance 600)
perform public.create_transaction('e1000000-0000-0000-0000-000000000003', 'CREDIT', 1100.00, 'Init 1100', gen_random_uuid());
perform public.create_transaction('e1000000-0000-0000-0000-000000000003', 'PAYMENT', 700.00, 'Down to 400', gen_random_uuid());

select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000003', 'CREDIT', 200.00, '400 to 600', gen_random_uuid()))->'alert',
  jsonb_build_object('level', 1, 'crossed_amount', '500.00'),
  'AL-06: Balance down to 400 by payment then up to 600 by credit produces alert level 1 again'
);

-- AL-07: Payments and reversals never produce an alert
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000003', 'PAYMENT', 100.00, 'Payment no alert', gen_random_uuid()))->>'alert',
  null,
  'AL-07: Payments never produce an alert'
);

select ok(
  not (public.reverse_transaction(
    (select id from public.transactions where customer_id = 'e1000000-0000-0000-0000-000000000003' and description = '400 to 600'),
    'Reversal test AL-07',
    gen_random_uuid()
  ) ? 'alert'),
  'AL-07: Reversals never produce an alert'
);

-- AL-08: Editing alert step changes future alerts only; no alert on edit
reset role;
update public.customers set alert_step = 1000.00 where id = 'e1000000-0000-0000-0000-000000000004';

set local role authenticated;
set local "request.jwt.claim.sub" = 'e0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "e0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Customer 4 balance is currently 1100.00. With step 1000, level_before is 1 (floor(1100/1000)=1).
-- Credit 200 -> balance 1300 -> level_after is 1 (floor(1300/1000)=1) -> no alert!
select is(
  (public.create_transaction('e1000000-0000-0000-0000-000000000004', 'CREDIT', 200.00, 'Under new step 1000', gen_random_uuid()))->>'alert',
  null,
  'AL-08: Alert step edit takes effect on future transactions only'
);

-- -----------------------------------------------------------------------------
-- 4. Error Codes & Contract Guards
-- -----------------------------------------------------------------------------
-- UNAUTHENTICATED
reset role;
select throws_ok(
  $$select public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 50.00, 'Test', gen_random_uuid())$$,
  'UNAUTHENTICATED',
  'Error: create_transaction raises UNAUTHENTICATED when auth.uid() is null'
);

select throws_ok(
  $$select public.reverse_transaction(gen_random_uuid(), 'Valid reason', gen_random_uuid())$$,
  'UNAUTHENTICATED',
  'Error: reverse_transaction raises UNAUTHENTICATED when auth.uid() is null'
);

select throws_ok(
  $$select public.dashboard_summary()$$,
  'UNAUTHENTICATED',
  'Error: dashboard_summary raises UNAUTHENTICATED when auth.uid() is null'
);

-- Authenticate for remaining error tests
set local role authenticated;
set local "request.jwt.claim.sub" = 'e0000000-0000-0000-0000-000000000001';
set local "request.jwt.claims" = '{"sub": "e0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- VALIDATION_FAILED on note > 140 chars
select throws_ok(
  $$select public.create_transaction(
      'e1000000-0000-0000-0000-000000000001',
      'CREDIT',
      50.00,
      repeat('x', 141),
      gen_random_uuid()
    )$$,
  'VALIDATION_FAILED',
  'Error: note longer than 140 characters raises VALIDATION_FAILED'
);

-- VALIDATION_FAILED on null customer_id
select throws_ok(
  $$select public.create_transaction(null, 'CREDIT', 50.00, 'Note', gen_random_uuid())$$,
  'VALIDATION_FAILED',
  'Error: null customer_id raises VALIDATION_FAILED'
);

-- AMOUNT_OUT_OF_RANGE
select throws_ok(
  $$select public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 0, 'Zero amount', gen_random_uuid())$$,
  'AMOUNT_OUT_OF_RANGE',
  'Error: amount 0 raises AMOUNT_OUT_OF_RANGE'
);

select throws_ok(
  $$select public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 100000.01, 'Excess amount', gen_random_uuid())$$,
  'AMOUNT_OUT_OF_RANGE',
  'Error: amount > 100000 raises AMOUNT_OUT_OF_RANGE'
);

select throws_ok(
  $$select public.create_transaction('e1000000-0000-0000-0000-000000000001', 'CREDIT', 50.999, '3 decimals', gen_random_uuid())$$,
  'AMOUNT_OUT_OF_RANGE',
  'Error: scale > 2 raises AMOUNT_OUT_OF_RANGE'
);

-- CUSTOMER_NOT_FOUND
select throws_ok(
  $$select public.create_transaction(gen_random_uuid(), 'CREDIT', 50.00, 'Note', gen_random_uuid())$$,
  'CUSTOMER_NOT_FOUND',
  'Error: Nonexistent customer raises CUSTOMER_NOT_FOUND'
);

-- CUSTOMER_INACTIVE
select throws_ok(
  $$select public.create_transaction('e1000000-0000-0000-0000-000000000005', 'CREDIT', 50.00, 'Note', gen_random_uuid())$$,
  'CUSTOMER_INACTIVE',
  'Error: Credit to inactive customer raises CUSTOMER_INACTIVE'
);

-- ADVANCE_CONFIRMATION_REQUIRED
select throws_ok(
  $$select public.create_transaction('e1000000-0000-0000-0000-000000000005', 'PAYMENT', 100.00, 'Overpay', gen_random_uuid(), false)$$,
  'ADVANCE_CONFIRMATION_REQUIRED',
  'Error: Unconfirmed payment exceeding balance raises ADVANCE_CONFIRMATION_REQUIRED'
);

-- TRANSACTION_NOT_FOUND
select throws_ok(
  $$select public.reverse_transaction(gen_random_uuid(), 'Reversal reason', gen_random_uuid())$$,
  'TRANSACTION_NOT_FOUND',
  'Error: Nonexistent transaction raises TRANSACTION_NOT_FOUND on reversal'
);

-- Reversal error guards: setup transaction for reversal tests
perform public.create_transaction(
  'e1000000-0000-0000-0000-000000000001',
  'CREDIT',
  80.00,
  'Original for rev guard',
  'f0000000-0000-0000-0000-000000000080'::uuid
);

perform public.reverse_transaction(
  (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000080'),
  'First reversal valid',
  'f0000000-0000-0000-0000-000000000081'::uuid
);

-- CANNOT_REVERSE_REVERSAL
select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000081'),
      'Reverse reversal attempt',
      gen_random_uuid()
    )$$,
  'CANNOT_REVERSE_REVERSAL',
  'Error: Attempting to reverse a reversal raises CANNOT_REVERSE_REVERSAL'
);

-- ALREADY_REVERSED
select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000080'),
      'Second reversal attempt',
      gen_random_uuid()
    )$$,
  'ALREADY_REVERSED',
  'Error: Attempting to reverse an already reversed transaction raises ALREADY_REVERSED'
);

-- VALIDATION_FAILED on reversal reason length
select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000080'),
      'ab',
      gen_random_uuid()
    )$$,
  'VALIDATION_FAILED',
  'Error: Reason shorter than 3 characters raises VALIDATION_FAILED'
);

select throws_ok(
  $$select public.reverse_transaction(
      (select id from public.transactions where idempotency_key = 'f0000000-0000-0000-0000-000000000080'),
      repeat('r', 141),
      gen_random_uuid()
    )$$,
  'VALIDATION_FAILED',
  'Error: Reason longer than 140 characters raises VALIDATION_FAILED'
);

select * from finish();
rollback;
