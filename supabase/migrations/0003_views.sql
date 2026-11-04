-- Migration 0003: Views with security_invoker = true
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Section 5.3

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
