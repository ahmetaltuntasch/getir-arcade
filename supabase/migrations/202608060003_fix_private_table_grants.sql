-- Private tables are never writable by browser roles. Authenticated users may
-- only read their own rows through the existing RLS policies.
revoke all on public.profiles from anon, authenticated;
revoke all on public.runs from anon, authenticated;
revoke all on public.xp_ledger from anon, authenticated;
revoke all on public.task_progress from anon, authenticated;
revoke all on public.login_rate_limits from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.runs to authenticated;
grant select on public.xp_ledger to authenticated;
grant select on public.task_progress to authenticated;

-- Edge Functions use service_role for server-owned writes and private lookups.
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.runs to service_role;
grant select, insert, update, delete on public.xp_ledger to service_role;
grant select, insert, update, delete on public.task_progress to service_role;
grant select, insert, update, delete on public.login_rate_limits to service_role;
grant usage, select on sequence public.login_rate_limits_id_seq to service_role;
