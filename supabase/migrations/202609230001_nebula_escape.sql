-- Publish Nebula Escape as a first-class Arcade game.
alter table public.runs drop constraint if exists runs_game_id_check;
alter table public.runs add constraint runs_game_id_check check(game_id in('getir-rush','depo-tetris','nebula-escape'));

create or replace function public.submit_arcade_run(
  p_user_id uuid,
  p_client_run_id text,
  p_game_id text,
  p_score integer,
  p_duration_seconds integer,
  p_metrics jsonb,
  p_completed_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp integer;
  v_bonus integer := 0;
  v_inserted integer := 0;
  v_task record;
  v_increment integer;
  v_period text;
  v_previous integer;
  v_rewarded boolean;
  v_value integer;
begin
  if not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'profile_not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  v_xp := least(400, case
    when p_game_id='getir-rush' then 50+coalesce((p_metrics->>'deliveries')::integer,0)*5+floor(p_score/100.0)::integer
    when p_game_id='depo-tetris' then 50+coalesce((p_metrics->>'rowsCleared')::integer,0)*15+floor(p_score/100.0)::integer
    when p_game_id='nebula-escape' then 50+coalesce((p_metrics->>'threats')::integer,0)*3+floor(p_score/100.0)::integer
    else 50+floor(p_score/100.0)::integer end);

  insert into public.runs(user_id,client_run_id,game_id,score,xp,duration_seconds,metrics,completed_at)
  values(p_user_id,p_client_run_id,p_game_id,p_score,v_xp,p_duration_seconds,p_metrics,p_completed_at)
  on conflict(user_id,client_run_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted=0 then return jsonb_build_object('duplicate',true); end if;

  insert into public.xp_ledger(user_id,amount,source,source_key,created_at)
  values(p_user_id,v_xp,p_game_id,'run:'||p_client_run_id,p_completed_at);

  for v_task in select * from (values
    ('daily_play','runs',1,100,'daily'),('daily_rush','deliveries',10,150,'daily'),('daily_depo','rowsCleared',3,150,'daily'),
    ('weekly_runs','runs',7,400,'weekly'),('weekly_rush','deliveries',50,500,'weekly'),('weekly_depo','rowsCleared',20,500,'weekly')
  ) as t(id,metric,target,reward,kind) loop
    v_increment := case when v_task.metric='runs' then 1 when v_task.metric='deliveries' and p_game_id='getir-rush' then coalesce((p_metrics->>'deliveries')::integer,0) when v_task.metric='rowsCleared' and p_game_id='depo-tetris' then coalesce((p_metrics->>'rowsCleared')::integer,0) else 0 end;
    if v_increment=0 then continue; end if;
    v_period := case when v_task.kind='daily' then to_char(p_completed_at at time zone 'Europe/Istanbul','YYYY-MM-DD') else to_char(date_trunc('week',p_completed_at at time zone 'Europe/Istanbul'),'YYYY-MM-DD') end;
    select value,rewarded into v_previous,v_rewarded from public.task_progress where user_id=p_user_id and period_key=v_period and task_id=v_task.id for update;
    v_previous := coalesce(v_previous,0); v_rewarded := coalesce(v_rewarded,false); v_value := least(v_task.target,v_previous+v_increment);
    insert into public.task_progress(user_id,period_key,task_id,value,rewarded,updated_at)
    values(p_user_id,v_period,v_task.id,v_value,v_rewarded or v_value>=v_task.target,now())
    on conflict(user_id,period_key,task_id) do update set value=excluded.value,rewarded=excluded.rewarded,updated_at=excluded.updated_at;
    if v_value>=v_task.target and not v_rewarded then
      insert into public.xp_ledger(user_id,amount,source,source_key,created_at) values(p_user_id,v_task.reward,v_task.id,'task:'||v_period||':'||v_task.id,now()) on conflict(user_id,source_key) do nothing;
      if found then v_bonus:=v_bonus+v_task.reward; end if;
    end if;
  end loop;

  update public.profiles set career_xp=career_xp+v_xp+v_bonus,total_score=total_score+p_score,total_runs=total_runs+1,updated_at=now() where id=p_user_id;
  return jsonb_build_object('duplicate',false,'xp',v_xp,'bonusXp',v_bonus);
end;
$$;

revoke all on function public.submit_arcade_run(uuid,text,text,integer,integer,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.submit_arcade_run(uuid,text,text,integer,integer,jsonb,timestamptz) to service_role;

drop view if exists public.nebula_leaderboard;
create view public.nebula_leaderboard with(security_invoker=false) as
select row_number() over(order by max(r.score) desc,p.nickname asc)::integer rank,p.nickname,max(r.score)::bigint score
from public.profiles p join public.runs r on r.user_id=p.id and r.game_id='nebula-escape' group by p.id,p.nickname;
grant select on public.nebula_leaderboard to anon,authenticated;
