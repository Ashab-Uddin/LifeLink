create table if not exists public.prediction_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disease text not null,
  model text not null default 'RandomForest',
  accuracy double precision,
  symptoms jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Repair an existing table if it was created with an older schema.
alter table public.prediction_history add column if not exists user_id uuid;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prediction_history'
      and column_name = 'predicted_disease'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prediction_history'
      and column_name = 'disease'
  ) then
    alter table public.prediction_history
      rename column predicted_disease to disease;
  end if;
end $$;

alter table public.prediction_history add column if not exists disease text;
alter table public.prediction_history add column if not exists model text default 'RandomForest';
alter table public.prediction_history add column if not exists accuracy double precision;
alter table public.prediction_history add column if not exists symptoms jsonb default '[]'::jsonb;
alter table public.prediction_history add column if not exists created_at timestamptz default now();

do $$
declare
  symptoms_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
  into symptoms_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'prediction_history'
    and a.attname = 'symptoms'
    and not a.attisdropped;

  if symptoms_type = 'text[]' then
    alter table public.prediction_history
      alter column symptoms type jsonb
      using to_jsonb(symptoms);
  end if;
end $$;

update public.prediction_history
set model = 'RandomForest'
where model is null;

update public.prediction_history
set symptoms = '[]'::jsonb
where symptoms is null;

update public.prediction_history
set created_at = now()
where created_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prediction_history_user_id_fkey'
  ) then
    alter table public.prediction_history
      add constraint prediction_history_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table public.prediction_history enable row level security;

drop policy if exists "Users can view their own prediction history" on public.prediction_history;
create policy "Users can view their own prediction history"
on public.prediction_history for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own prediction history" on public.prediction_history;
create policy "Users can create their own prediction history"
on public.prediction_history for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own prediction history" on public.prediction_history;
create policy "Users can delete their own prediction history"
on public.prediction_history for delete
to authenticated
using (auth.uid() = user_id);
