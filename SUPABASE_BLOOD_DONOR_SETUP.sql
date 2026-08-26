create table if not exists public.blood_donor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  blood_group text not null,
  phone text not null,
  email text,
  location text not null,
  last_donation_date date not null,
  notes text,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

alter table public.blood_donor_applications add column if not exists email text;
alter table public.blood_donor_applications add column if not exists gender text;
alter table public.blood_donor_applications add column if not exists date_of_birth date;
alter table public.blood_donor_applications add column if not exists division text;
alter table public.blood_donor_applications add column if not exists district text;
alter table public.blood_donor_applications add column if not exists upazila text;
alter table public.blood_donor_applications add column if not exists address text;
alter table public.blood_donor_applications add column if not exists whatsapp text;
alter table public.blood_donor_applications add column if not exists facebook text;
alter table public.blood_donor_applications add column if not exists weight_kg numeric;
alter table public.blood_donor_applications add column if not exists height text;
alter table public.blood_donor_applications add column if not exists emergency_phone text;
alter table public.blood_donor_applications add column if not exists medical_conditions text;
alter table public.blood_donor_applications add column if not exists current_medications text;
alter table public.blood_donor_applications add column if not exists total_donations integer not null default 0;

create or replace function public.validate_donor_profile_blood_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_group text;
begin
  select blood_group into profile_group from public.profiles where id = new.user_id;
  if nullif(trim(profile_group), '') is null or lower(trim(profile_group)) <> lower(trim(new.blood_group)) then
    raise exception 'Donor application blood group must match the profile blood group.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_donor_profile_blood_group on public.blood_donor_applications;
create trigger validate_donor_profile_blood_group
before insert or update of blood_group, user_id on public.blood_donor_applications
for each row execute function public.validate_donor_profile_blood_group();

create or replace function public.validate_profile_donor_blood_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.blood_donor_applications donor
    where donor.user_id = new.id
      and lower(trim(donor.blood_group)) <> lower(trim(coalesce(new.blood_group, '')))
  ) then
    raise exception 'Profile blood group must match the donor application blood group.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_profile_donor_blood_group on public.profiles;
create trigger validate_profile_donor_blood_group
before insert or update of blood_group on public.profiles
for each row execute function public.validate_profile_donor_blood_group();

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

drop policy if exists "Users can delete their own donor application" on public.blood_donor_applications;
create policy "Users can delete their own donor application"
on public.blood_donor_applications for delete
to authenticated
using (auth.uid() = user_id);