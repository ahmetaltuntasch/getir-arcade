create or replace function public.create_arcade_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nickname text := lower(trim(coalesce(new.raw_user_meta_data ->> 'nickname', '')));
begin
  if v_nickname !~ '^[a-z0-9._]{3,20}$' then
    raise exception 'invalid_arcade_nickname' using errcode = '23514';
  end if;

  insert into public.profiles (id, nickname)
  values (new.id, v_nickname);

  return new;
exception
  when unique_violation then
    raise exception 'arcade_nickname_taken' using errcode = '23505';
end;
$$;

revoke all on function public.create_arcade_profile_for_new_user() from public;

drop trigger if exists create_arcade_profile_after_signup on auth.users;
create trigger create_arcade_profile_after_signup
after insert on auth.users
for each row execute function public.create_arcade_profile_for_new_user();
