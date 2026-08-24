create table if not exists public.prediction_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disease text not null,
  model text not null default 'RandomForest',
  accuracy double precision,
  symptoms jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

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
