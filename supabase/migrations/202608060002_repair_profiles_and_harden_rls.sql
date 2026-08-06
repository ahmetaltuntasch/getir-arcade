-- Repair Auth users created before profile creation became transactional.
insert into public.profiles (id, nickname)
select
  u.id,
  lower(trim(u.raw_user_meta_data ->> 'nickname'))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
  and lower(trim(coalesce(u.raw_user_meta_data ->> 'nickname', ''))) ~ '^[a-z0-9._]{3,20}$'
  and not exists (
    select 1
    from public.profiles p
    where p.nickname = lower(trim(u.raw_user_meta_data ->> 'nickname'))
  )
on conflict do nothing;

-- Profile totals and role flags are server-owned. Clients only need SELECT.
drop policy if exists "profile owner updates" on public.profiles;
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.runs from anon, authenticated;
revoke insert, update, delete on public.xp_ledger from anon, authenticated;
revoke insert, update, delete on public.task_progress from anon, authenticated;

do $$
declare
  v_orphans integer;
begin
  select count(*) into v_orphans
  from auth.users u
  where not exists (select 1 from public.profiles p where p.id = u.id);

  if v_orphans > 0 then
    raise warning '% Auth users still have no repairable arcade profile', v_orphans;
  end if;
end;
$$;
