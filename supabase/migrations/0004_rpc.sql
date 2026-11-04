-- Migration 0004: RPC functions (create_transaction, reverse_transaction, dashboard_summary)
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Section 5.4

-- 1. create_transaction
create or replace function public.create_transaction(
  p_customer_id uuid,
  p_type public.txn_type,
  p_amount numeric,
  p_description text,
  p_idempotency_key uuid,
  p_confirm_advance boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_description text;
  v_customer public.customers%rowtype;
  v_existing public.transactions%rowtype;
  v_before numeric(12,2);
  v_after numeric(12,2);
  v_curr_balance numeric(12,2);
  v_txn public.transactions%rowtype;
  v_level_before int;
  v_level_after int;
  v_alert jsonb;
begin
  -- 1. Derive owner from auth.uid(); null raises UNAUTHENTICATED
  v_owner := auth.uid();
  if v_owner is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;

  -- 2. Validate parameters
  if p_customer_id is null or p_type is null or p_idempotency_key is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 100000 or scale(p_amount) > 2 then
    raise exception 'AMOUNT_OUT_OF_RANGE' using errcode = 'P0001';
  end if;

  v_description := btrim(p_description);
  if v_description = '' then
    v_description := null;
  end if;

  if v_description is not null and char_length(v_description) > 140 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  -- 3. Lock customer row for update
  select * into v_customer
  from public.customers
  where id = p_customer_id and owner_id = v_owner
  for update;

  if not found then
    raise exception 'CUSTOMER_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 4. Idempotent replay
  select * into v_existing
  from public.transactions
  where owner_id = v_owner and idempotency_key = p_idempotency_key;

  if found then
    -- Load matching customer if different from p_customer_id
    if v_existing.customer_id <> v_customer.id then
      select * into v_customer
      from public.customers
      where id = v_existing.customer_id and owner_id = v_owner;
    end if;

    select coalesce(sum(case type when 'CREDIT' then amount else -amount end), 0)::numeric(12,2)
    into v_curr_balance
    from public.transactions
    where customer_id = v_customer.id;

    return jsonb_build_object(
      'replayed', true,
      'transaction', jsonb_build_object(
        'id', v_existing.id,
        'type', v_existing.type,
        'amount', v_existing.amount::text,
        'description', v_existing.description,
        'created_at', to_jsonb(v_existing.created_at)
      ),
      'customer', jsonb_build_object(
        'id', v_customer.id,
        'name', v_customer.name,
        'phone', v_customer.phone,
        'alert_step', v_customer.alert_step::text
      ),
      'balance_before', null,
      'balance_after', v_curr_balance::text,
      'alert', null
    );
  end if;

  -- 5. Inactive customer cannot receive CREDIT
  if p_type = 'CREDIT' and not v_customer.is_active then
    raise exception 'CUSTOMER_INACTIVE' using errcode = 'P0001';
  end if;

  -- 6. Current balance before transaction
  select coalesce(sum(case type when 'CREDIT' then amount else -amount end), 0)::numeric(12,2)
  into v_before
  from public.transactions
  where customer_id = v_customer.id;

  -- 7. Payment greater than balance requires explicit confirmation
  if p_type = 'PAYMENT' and p_amount > v_before and not coalesce(p_confirm_advance, false) then
    raise exception 'ADVANCE_CONFIRMATION_REQUIRED'
      using errcode = 'P0001',
            detail = json_build_object(
              'balance', v_before::text,
              'amount', p_amount::numeric(12,2)::text,
              'advance_after', (p_amount - v_before)::numeric(12,2)::text
            )::text;
  end if;

  -- 8. Insert transaction row
  insert into public.transactions (
    owner_id,
    customer_id,
    type,
    amount,
    description,
    is_reversal,
    reversal_of,
    advance_confirmed,
    idempotency_key
  ) values (
    v_owner,
    v_customer.id,
    p_type,
    p_amount::numeric(12,2),
    v_description,
    false,
    null,
    (p_type = 'PAYMENT' and p_amount > v_before),
    p_idempotency_key
  )
  returning * into v_txn;

  -- 9. Calculate new balance
  if p_type = 'CREDIT' then
    v_after := (v_before + p_amount)::numeric(12,2);
  else
    v_after := (v_before - p_amount)::numeric(12,2);
  end if;

  -- 10. Alert calculation (CREDIT only)
  if p_type = 'CREDIT' then
    v_level_before := case when v_before > 0 then floor(v_before / v_customer.alert_step)::int else 0 end;
    v_level_after  := case when v_after > 0  then floor(v_after / v_customer.alert_step)::int else 0 end;
    if v_level_after > v_level_before then
      v_alert := jsonb_build_object(
        'level', v_level_after,
        'crossed_amount', (v_level_after * v_customer.alert_step)::numeric(12,2)::text
      );
    else
      v_alert := null;
    end if;
  else
    v_alert := null;
  end if;

  -- 11. Return result jsonb
  return jsonb_build_object(
    'replayed', false,
    'transaction', jsonb_build_object(
      'id', v_txn.id,
      'type', v_txn.type,
      'amount', v_txn.amount::text,
      'description', v_txn.description,
      'created_at', to_jsonb(v_txn.created_at)
    ),
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'name', v_customer.name,
      'phone', v_customer.phone,
      'alert_step', v_customer.alert_step::text
    ),
    'balance_before', v_before::text,
    'balance_after', v_after::text,
    'alert', v_alert
  );
end;
$$;

-- 2. reverse_transaction
create or replace function public.reverse_transaction(
  p_transaction_id uuid,
  p_reason text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_reason text;
  v_orig public.transactions%rowtype;
  v_customer public.customers%rowtype;
  v_existing_replay public.transactions%rowtype;
  v_rev_type public.txn_type;
  v_rev public.transactions%rowtype;
  v_after numeric(12,2);
  v_curr_balance numeric(12,2);
begin
  -- 1. Auth check and validation
  v_owner := auth.uid();
  if v_owner is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;

  if p_transaction_id is null or p_idempotency_key is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  v_reason := btrim(p_reason);
  if v_reason is null or char_length(v_reason) < 3 or char_length(v_reason) > 140 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  -- 2. Load original transaction
  select * into v_orig
  from public.transactions
  where id = p_transaction_id and owner_id = v_owner;

  if not found then
    raise exception 'TRANSACTION_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 3. Lock customer row for update
  select * into v_customer
  from public.customers
  where id = v_orig.customer_id and owner_id = v_owner
  for update;

  if not found then
    raise exception 'CUSTOMER_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 4. Idempotent replay check
  select * into v_existing_replay
  from public.transactions
  where owner_id = v_owner and idempotency_key = p_idempotency_key;

  if found then
    select coalesce(sum(case type when 'CREDIT' then amount else -amount end), 0)::numeric(12,2)
    into v_curr_balance
    from public.transactions
    where customer_id = v_customer.id;

    return jsonb_build_object(
      'replayed', true,
      'original_id', v_existing_replay.reversal_of,
      'balance_after', v_curr_balance::text,
      'reversal', jsonb_build_object(
        'id', v_existing_replay.id,
        'type', v_existing_replay.type,
        'amount', v_existing_replay.amount::text,
        'description', v_existing_replay.description,
        'created_at', to_jsonb(v_existing_replay.created_at)
      )
    );
  end if;

  -- 5. Reversal constraints check
  if v_orig.is_reversal then
    raise exception 'CANNOT_REVERSE_REVERSAL' using errcode = 'P0001';
  end if;

  perform 1
  from public.transactions
  where reversal_of = v_orig.id;

  if found then
    raise exception 'ALREADY_REVERSED' using errcode = 'P0001';
  end if;

  -- 6. Insert reversal transaction (opposite type, same amount, advance_confirmed = false)
  v_rev_type := case v_orig.type
    when 'CREDIT' then 'PAYMENT'::public.txn_type
    else 'CREDIT'::public.txn_type
  end;

  insert into public.transactions (
    owner_id,
    customer_id,
    type,
    amount,
    description,
    is_reversal,
    reversal_of,
    advance_confirmed,
    idempotency_key
  ) values (
    v_owner,
    v_customer.id,
    v_rev_type,
    v_orig.amount,
    v_reason,
    true,
    v_orig.id,
    false,
    p_idempotency_key
  )
  returning * into v_rev;

  -- 7. Calculate new balance and return
  select coalesce(sum(case type when 'CREDIT' then amount else -amount end), 0)::numeric(12,2)
  into v_after
  from public.transactions
  where customer_id = v_customer.id;

  return jsonb_build_object(
    'replayed', false,
    'original_id', v_orig.id,
    'balance_after', v_after::text,
    'reversal', jsonb_build_object(
      'id', v_rev.id,
      'type', v_rev.type,
      'amount', v_rev.amount::text,
      'description', v_rev.description,
      'created_at', to_jsonb(v_rev.created_at)
    )
  );
end;
$$;

-- 3. dashboard_summary
create or replace function public.dashboard_summary()
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_owner uuid;
  v_outstanding numeric(12,2);
  v_advance numeric(12,2);
  v_active int;
  v_alerts int;
  v_credit_today numeric(12,2);
  v_payments_today numeric(12,2);
begin
  v_owner := auth.uid();
  if v_owner is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;

  -- Customer balances summary:
  -- total_outstanding = sum of balance where balance > 0 across all customers (including inactive)
  -- total_advance = absolute sum of negative balances
  -- active_customers = count where is_active
  -- alert_customers = count where status = 'ALERT'
  select
    coalesce(sum(case when balance > 0 then balance else 0 end), 0)::numeric(12,2),
    coalesce(sum(case when balance < 0 then -balance else 0 end), 0)::numeric(12,2),
    count(*) filter (where is_active)::int,
    count(*) filter (where status = 'ALERT')::int
  into
    v_outstanding,
    v_advance,
    v_active,
    v_alerts
  from public.customer_balances;

  -- Today's credit and payments (Asia/Kolkata):
  -- sum of amount where type matches, is_reversal = false, not reversed, and today in IST
  select
    coalesce(sum(case when t.type = 'CREDIT' then t.amount else 0 end), 0)::numeric(12,2),
    coalesce(sum(case when t.type = 'PAYMENT' then t.amount else 0 end), 0)::numeric(12,2)
  into
    v_credit_today,
    v_payments_today
  from public.transactions t
  where t.is_reversal = false
    and not exists (
      select 1 from public.transactions r where r.reversal_of = t.id
    )
    and (t.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date;

  return jsonb_build_object(
    'total_outstanding', v_outstanding::text,
    'total_advance', v_advance::text,
    'active_customers', v_active,
    'alert_customers', v_alerts,
    'credit_today', v_credit_today::text,
    'payments_today', v_payments_today::text
  );
end;
$$;
