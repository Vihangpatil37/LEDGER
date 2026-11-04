-- Chai Ledger Development Seed Data
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 5.4, 7.6.1, DB-15, E2E-14
--
-- Target metrics verified:
-- total_outstanding = 4250.00 (includes active + inactive positive balances)
-- total_advance     = 200.00  (absolute sum of negative balances)
-- active_customers  = 18      (count of is_active = true)
-- alert_customers   = 4       (count of status = 'ALERT', balance >= alert_step)
-- credit_today      = 640.00  (Asia/Kolkata unreversed credit entries today)
-- payments_today    = 300.00  (Asia/Kolkata non-reversal payment entries today)

do $$
declare
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_today_ist timestamptz;
  v_1d_ago timestamptz;
  v_2d_ago timestamptz;
  v_3d_ago timestamptz;
  v_4d_ago timestamptz;
  v_5d_ago timestamptz;
  v_10d_ago timestamptz;
  v_14d_ago timestamptz;
  v_15d_ago timestamptz;
begin
  -- 1. Create or ensure development user exists in auth.users
  if not exists (select 1 from auth.users where id = v_owner_id) then
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      v_owner_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'owner@chailedger.local',
      -- bcrypt hash for 'password123'
      '$2a$10$w3bYF/3b/b1sQfCszZ4QOeFHz6q7E0m/lT5v7a8.5fIe1bX3pWlsq',
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"shop_name":"Sharma Tea Stall"}',
      now(),
      now()
    );
  end if;

  -- 2. Upsert profile for the owner
  insert into public.profiles (
    id,
    shop_name,
    owner_name,
    phone,
    default_alert_step,
    reminder_template
  ) values (
    v_owner_id,
    'Sharma Tea Stall',
    'Ramesh Sharma',
    '919876543210',
    500.00,
    E'Namaste {name} ji! 🙏\n\nAapke account mein ₹{amount} ka udhaar pending hai.\n\nKripya apna pending payment clear kar dein.\n\nDhanyavaad!'
  )
  on conflict (id) do update set
    shop_name = excluded.shop_name,
    owner_name = excluded.owner_name,
    phone = excluded.phone,
    default_alert_step = excluded.default_alert_step,
    reminder_template = excluded.reminder_template;

  -- 3. Base timestamps in Asia/Kolkata
  v_today_ist := (date_trunc('day', now() at time zone 'Asia/Kolkata') + time '10:00:00') at time zone 'Asia/Kolkata';
  v_1d_ago    := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '1 day'  + time '11:00:00') at time zone 'Asia/Kolkata';
  v_2d_ago    := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '2 days' + time '12:00:00') at time zone 'Asia/Kolkata';
  v_3d_ago    := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '3 days' + time '14:00:00') at time zone 'Asia/Kolkata';
  v_4d_ago    := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '4 days' + time '15:00:00') at time zone 'Asia/Kolkata';
  v_5d_ago    := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '5 days' + time '16:00:00') at time zone 'Asia/Kolkata';
  v_10d_ago   := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '10 days' + time '10:00:00') at time zone 'Asia/Kolkata';
  v_14d_ago   := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '14 days' + time '11:00:00') at time zone 'Asia/Kolkata';
  v_15d_ago   := (date_trunc('day', now() at time zone 'Asia/Kolkata') - interval '15 days' + time '12:00:00') at time zone 'Asia/Kolkata';

  -- 4. Clean existing seed data for owner if re-running
  delete from public.transactions where owner_id = v_owner_id;
  delete from public.customers where owner_id = v_owner_id;

  -- 5. Insert 20 customers (18 active, 2 inactive)
  insert into public.customers (id, owner_id, name, phone, alert_step, is_active, created_at, updated_at) values
    ('10000000-0000-0000-0000-000000000001', v_owner_id, 'Rahul Patel',     '919876543210', 500.00, true,  v_5d_ago, v_today_ist),
    ('10000000-0000-0000-0000-000000000002', v_owner_id, 'Amit Shah',       '919823456789', 500.00, true,  v_5d_ago, v_today_ist),
    ('10000000-0000-0000-0000-000000000003', v_owner_id, 'Jay Mehta',       '919834567890', 500.00, true,  v_5d_ago, v_today_ist),
    ('10000000-0000-0000-0000-000000000004', v_owner_id, 'Vikram Singh',    '919845678901', 500.00, true,  v_5d_ago, v_2d_ago),
    ('10000000-0000-0000-0000-000000000005', v_owner_id, 'Suresh Kumar',    '919856789012', 500.00, true,  v_5d_ago, v_today_ist),
    ('10000000-0000-0000-0000-000000000006', v_owner_id, 'Pooja Sharma',    '919867890123', 500.00, true,  v_5d_ago, v_today_ist),
    ('10000000-0000-0000-0000-000000000007', v_owner_id, 'Anil Verma',      '919878901234', 500.00, true,  v_5d_ago, v_today_ist),
    ('10000000-0000-0000-0000-000000000008', v_owner_id, 'Deepak Joshi',    '919889012345', 500.00, true,  v_5d_ago, v_2d_ago),
    ('10000000-0000-0000-0000-000000000009', v_owner_id, 'Priya Nair',      '919890123456', 500.00, true,  v_5d_ago, v_1d_ago),
    ('10000000-0000-0000-0000-000000000010', v_owner_id, 'Rajesh Gupta',    '919801234567', 500.00, true,  v_5d_ago, v_2d_ago),
    ('10000000-0000-0000-0000-000000000011', v_owner_id, 'Sunita Rao',      '919712345678', 500.00, true,  v_5d_ago, v_3d_ago),
    ('10000000-0000-0000-0000-000000000012', v_owner_id, 'Neha Patel',      '919723456789', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000013', v_owner_id, 'Sanjay Kulkarni', '919734567890', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000014', v_owner_id, 'Kavita Desai',    '919745678901', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000015', v_owner_id, 'Rohit Verma',     '919756789012', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000016', v_owner_id, 'Manish Pandey',   '919767890123', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000017', v_owner_id, 'Sneha Reddy',     '919778901234', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000018', v_owner_id, 'Gaurav Mishra',   '919789012345', 500.00, true,  v_5d_ago, v_5d_ago),
    ('10000000-0000-0000-0000-000000000019', v_owner_id, 'Manoj Tiwari',    '919790123456', 500.00, false, v_15d_ago, v_10d_ago),
    ('10000000-0000-0000-0000-000000000020', v_owner_id, 'Dinesh Yadav',    '919701234567', 500.00, false, v_15d_ago, v_14d_ago);

  -- 6. Insert transactions

  -- Customer 1: Rahul Patel (Target balance: 1150.00, ALERT)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000001', v_owner_id, '10000000-0000-0000-0000-000000000001', 'CREDIT', 650.00, 'Office tea and samosas', false, null, false, gen_random_uuid(), v_3d_ago),
    ('20000000-0000-0000-0000-000000000002', v_owner_id, '10000000-0000-0000-0000-000000000001', 'CREDIT', 500.00, 'Chai party', false, null, false, gen_random_uuid(), v_today_ist + interval '10 minutes');

  -- Customer 2: Amit Shah (Target balance: 1050.00, ALERT)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000003', v_owner_id, '10000000-0000-0000-0000-000000000002', 'CREDIT', 1250.00, 'Weekly special cutting', false, null, false, gen_random_uuid(), v_4d_ago),
    ('20000000-0000-0000-0000-000000000004', v_owner_id, '10000000-0000-0000-0000-000000000002', 'PAYMENT', 200.00, 'UPI part payment', false, null, false, gen_random_uuid(), v_today_ist + interval '30 minutes');

  -- Customer 3: Jay Mehta (Target balance: 550.00, ALERT)
  -- Includes a transaction created today and reversed today (reversals excluded from today's totals per DB-15)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000005', v_owner_id, '10000000-0000-0000-0000-000000000003', 'CREDIT', 550.00, 'Monthly chai account', false, null, false, gen_random_uuid(), v_5d_ago),
    ('20000000-0000-0000-0000-000000000006', v_owner_id, '10000000-0000-0000-0000-000000000003', 'CREDIT', 50.00, 'Chai', false, null, false, gen_random_uuid(), v_today_ist + interval '45 minutes'),
    ('20000000-0000-0000-0000-000000000007', v_owner_id, '10000000-0000-0000-0000-000000000003', 'PAYMENT', 50.00, 'Wrong entry entered by mistake', true, '20000000-0000-0000-0000-000000000006', false, gen_random_uuid(), v_today_ist + interval '50 minutes');

  -- Customer 4: Vikram Singh (Target balance: 600.00, ALERT)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000008', v_owner_id, '10000000-0000-0000-0000-000000000004', 'CREDIT', 600.00, 'Tea & snacks for garage staff', false, null, false, gen_random_uuid(), v_2d_ago);

  -- Customer 5: Suresh Kumar (Target balance: 350.00, OWING)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000009', v_owner_id, '10000000-0000-0000-0000-000000000005', 'CREDIT', 250.00, 'Special ginger tea', false, null, false, gen_random_uuid(), v_3d_ago),
    ('20000000-0000-0000-0000-000000000010', v_owner_id, '10000000-0000-0000-0000-000000000005', 'CREDIT', 100.00, 'Chai and cigarette', false, null, false, gen_random_uuid(), v_today_ist + interval '2 hours');

  -- Customer 6: Pooja Sharma (Target balance: 200.00, OWING)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000011', v_owner_id, '10000000-0000-0000-0000-000000000006', 'CREDIT', 300.00, 'Elaichi chai', false, null, false, gen_random_uuid(), v_2d_ago),
    ('20000000-0000-0000-0000-000000000012', v_owner_id, '10000000-0000-0000-0000-000000000006', 'PAYMENT', 100.00, 'Cash payment', false, null, false, gen_random_uuid(), v_today_ist + interval '2 hours 30 minutes');

  -- Customer 7: Anil Verma (Target balance: 120.00, OWING)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000013', v_owner_id, '10000000-0000-0000-0000-000000000007', 'CREDIT', 80.00, 'Morning tea', false, null, false, gen_random_uuid(), v_1d_ago),
    ('20000000-0000-0000-0000-000000000014', v_owner_id, '10000000-0000-0000-0000-000000000007', 'CREDIT', 40.00, 'Cutting chai', false, null, false, gen_random_uuid(), v_today_ist + interval '3 hours');

  -- Customer 8: Deepak Joshi (Target balance: 80.00, OWING)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000015', v_owner_id, '10000000-0000-0000-0000-000000000008', 'CREDIT', 80.00, 'Tea and biscuit', false, null, false, gen_random_uuid(), v_2d_ago);

  -- Customer 9: Priya Nair (Target balance: -200.00, ADVANCE)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000016', v_owner_id, '10000000-0000-0000-0000-000000000009', 'PAYMENT', 200.00, 'Advance for monthly tea', false, null, true, gen_random_uuid(), v_1d_ago);

  -- Customer 10: Rajesh Gupta (Target balance: 0.00, CLEAR)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000017', v_owner_id, '10000000-0000-0000-0000-000000000010', 'CREDIT', 100.00, 'Lemon tea', false, null, false, gen_random_uuid(), v_3d_ago),
    ('20000000-0000-0000-0000-000000000018', v_owner_id, '10000000-0000-0000-0000-000000000010', 'PAYMENT', 100.00, 'UPI clear', false, null, false, gen_random_uuid(), v_2d_ago);

  -- Customer 11: Sunita Rao (Target balance: 0.00, CLEAR)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000019', v_owner_id, '10000000-0000-0000-0000-000000000011', 'CREDIT', 250.00, 'Masala chai flask', false, null, false, gen_random_uuid(), v_4d_ago),
    ('20000000-0000-0000-0000-000000000020', v_owner_id, '10000000-0000-0000-0000-000000000011', 'PAYMENT', 250.00, 'Cash settlement', false, null, false, gen_random_uuid(), v_3d_ago);

  -- Customer 19: Manoj Tiwari (INACTIVE, Target balance: 150.00, OWING)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000021', v_owner_id, '10000000-0000-0000-0000-000000000019', 'CREDIT', 150.00, 'Old balance before shop shifted', false, null, false, gen_random_uuid(), v_10d_ago);

  -- Customer 20: Dinesh Yadav (INACTIVE, Target balance: 0.00, CLEAR)
  insert into public.transactions (id, owner_id, customer_id, type, amount, description, is_reversal, reversal_of, advance_confirmed, idempotency_key, created_at)
  values
    ('20000000-0000-0000-0000-000000000022', v_owner_id, '10000000-0000-0000-0000-000000000020', 'CREDIT', 100.00, 'Old chai bill', false, null, false, gen_random_uuid(), v_15d_ago),
    ('20000000-0000-0000-0000-000000000023', v_owner_id, '10000000-0000-0000-0000-000000000020', 'PAYMENT', 100.00, 'Settled on closing account', false, null, false, gen_random_uuid(), v_14d_ago);

end $$;
