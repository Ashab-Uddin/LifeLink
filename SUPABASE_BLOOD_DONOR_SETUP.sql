create table if not exists public.blood_donor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  blood_group text not null,
  phone text not null,
  location text not null,
  last_donation_date date not null,
  notes text,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

alter table public.blood_donor_applications enable row level security;

drop policy if exists "Anyone can view available blood donors" on public.blood_donor_applications;
create policy "Anyone can view available blood donors"
on public.blood_donor_applications for select
to anon, authenticated
using (status = 'available');

drop policy if exists "Users can create their own donor application" on public.blood_donor_applications;
create policy "Users can create their own donor application"
on public.blood_donor_applications for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own donor application" on public.blood_donor_applications;
create policy "Users can update their own donor application"
on public.blood_donor_applications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);