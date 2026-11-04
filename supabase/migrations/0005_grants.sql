-- Migration 0005: Grants and Revocations
-- Spec: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Section 5.5

-- Table and view permissions
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select on public.transactions to authenticated;
grant select on public.customer_balances, public.transaction_ledger to authenticated;

-- Function execution permissions
revoke execute on function public.create_transaction(uuid, public.txn_type, numeric, text, uuid, boolean) from public, anon;
revoke execute on function public.reverse_transaction(uuid, text, uuid) from public, anon;
revoke execute on function public.dashboard_summary() from public, anon;

grant execute on function public.create_transaction(uuid, public.txn_type, numeric, text, uuid, boolean) to authenticated;
grant execute on function public.reverse_transaction(uuid, text, uuid) to authenticated;
grant execute on function public.dashboard_summary() to authenticated;

-- Revoke execute on trigger functions from public/anon/authenticated to prevent direct RPC invocation
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.block_transaction_mutation() from public, anon, authenticated;
revoke execute on function public.validate_reversal() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
