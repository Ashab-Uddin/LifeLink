create table if not exists public.ambulances (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text not null,
  phone text,
  location text not null,
  latitude numeric,
  longitude numeric,
  status text not null default 'available' check (status in ('available', 'busy', 'offline')),
  base_fare numeric not null default 300 check (base_fare >= 0),
  per_km_rate numeric not null default 2 check (per_km_rate >= 0),
  hospital text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ambulances add column if not exists provider_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.ambulance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ambulance_id uuid not null references public.ambulances(id) on delete restrict,
  patient_name text not null,
  patient_phone text not null,
  emergency_type text not null,
  pickup_location text not null,
  pickup_latitude numeric not null check (pickup_latitude between -90 and 90),
  pickup_longitude numeric not null check (pickup_longitude between -180 and 180),
  destination_hospital text not null,
  destination_latitude numeric not null check (destination_latitude between -90 and 90),
  destination_longitude numeric not null check (destination_longitude between -180 and 180),
  notes text,
  distance_km numeric not null check (distance_km >= 0),
  base_fare numeric not null check (base_fare >= 0),
  per_km_rate numeric not null check (per_km_rate >= 0),
  estimated_fare numeric not null check (estimated_fare >= 0),
  final_distance_km numeric check (final_distance_km is null or final_distance_km >= 0),
  final_fare numeric check (final_fare is null or final_fare >= 0),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'rejected', 'on_the_way', 'picked_up', 'arrived', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  pickup_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ambulance_requests add column if not exists provider_location text;
alter table public.ambulance_requests add column if not exists provider_latitude numeric;
alter table public.ambulance_requests add column if not exists provider_longitude numeric;
alter table public.ambulance_requests add column if not exists estimated_arrival_at timestamptz;
alter table public.ambulance_requests add column if not exists accepted_at timestamptz;

alter table public.ambulance_requests drop constraint if exists ambulance_requests_status_check;
update public.ambulance_requests set status = 'requested' where status = 'pending';
alter table public.ambulance_requests add constraint ambulance_requests_status_check check (status in ('requested', 'accepted', 'rejected', 'on_the_way', 'picked_up', 'arrived', 'completed', 'cancelled'));

alter table public.ambulances enable row level security;
alter table public.ambulance_requests enable row level security;

drop policy if exists "Anyone can view available ambulances" on public.ambulances;
create policy "Anyone can view available ambulances" on public.ambulances for select to anon, authenticated using (status = 'available');

drop policy if exists "Users can view their ambulance requests" on public.ambulance_requests;
create policy "Users can view their ambulance requests" on public.ambulance_requests for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Admins can view ambulance requests" on public.ambulance_requests;
create policy "Admins can view ambulance requests" on public.ambulance_requests for select to authenticated using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists "Providers can view their ambulance requests" on public.ambulance_requests;
create policy "Providers can view their ambulance requests" on public.ambulance_requests for select to authenticated using (exists (select 1 from public.ambulances where ambulances.id = ambulance_requests.ambulance_id and ambulances.provider_user_id = auth.uid()));

drop policy if exists "Admins can manage ambulances" on public.ambulances;
create policy "Admins can manage ambulances" on public.ambulances for all to authenticated using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin') with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists "Providers can view their ambulances" on public.ambulances;
create policy "Providers can view their ambulances" on public.ambulances for select to authenticated using (provider_user_id = auth.uid());

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ambulance_requests') then
    alter publication supabase_realtime add table public.ambulance_requests;
  end if;
end;
$$;

create or replace function public.create_ambulance_request(
  p_ambulance_id uuid,
  p_patient_name text,
  p_patient_phone text,
  p_emergency_type text,
  p_pickup_location text,
  p_pickup_latitude numeric,
  p_pickup_longitude numeric,
  p_destination_hospital text,
  p_destination_latitude numeric,
  p_destination_longitude numeric,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  ambulance_row public.ambulances;
  request_id uuid;
  distance numeric;
begin
  select * into ambulance_row from public.ambulances where id = p_ambulance_id and status = 'available' for update;
  if not found then raise exception 'This ambulance is no longer available.'; end if;
  if ambulance_row.provider_user_id = auth.uid() then raise exception 'You cannot request your own ambulance.'; end if;
  if trim(p_patient_phone) !~ '^[0-9]{11}$' then raise exception 'Enter an 11-digit phone number.'; end if;
  if nullif(trim(p_patient_name), '') is null or nullif(trim(p_patient_phone), '') is null then raise exception 'Patient name and phone are required.'; end if;
  if p_pickup_latitude not between -90 and 90 or p_destination_latitude not between -90 and 90 or p_pickup_longitude not between -180 and 180 or p_destination_longitude not between -180 and 180 then raise exception 'Invalid location coordinates.'; end if;
  distance := 6371 * 2 * asin(sqrt(
    power(sin(radians(p_destination_latitude - p_pickup_latitude) / 2), 2)
    + cos(radians(p_pickup_latitude))
      * cos(radians(p_destination_latitude))
      * power(sin(radians(p_destination_longitude - p_pickup_longitude) / 2), 2)
  ));
  insert into public.ambulance_requests (user_id, ambulance_id, patient_name, patient_phone, emergency_type, pickup_location, pickup_latitude, pickup_longitude, destination_hospital, destination_latitude, destination_longitude, notes, distance_km, base_fare, per_km_rate, estimated_fare, status)
  values (auth.uid(), ambulance_row.id, trim(p_patient_name), trim(p_patient_phone), trim(p_emergency_type), trim(p_pickup_location), p_pickup_latitude, p_pickup_longitude, trim(p_destination_hospital), p_destination_latitude, p_destination_longitude, p_notes, round(distance::numeric, 2), ambulance_row.base_fare, ambulance_row.per_km_rate, round((ambulance_row.base_fare + distance * ambulance_row.per_km_rate)::numeric, 2), 'requested')
  returning id into request_id;
  update public.ambulances set status = 'busy', updated_at = now() where id = ambulance_row.id;
  return request_id;
end;
$$;

grant execute on function public.create_ambulance_request(uuid, text, text, text, text, numeric, numeric, text, numeric, numeric, text) to authenticated;

create or replace function public.register_ambulance(
  p_name text,
  p_type text,
  p_phone text,
  p_location text,
  p_latitude numeric,
  p_longitude numeric,
  p_base_fare numeric default 300,
  p_per_km_rate numeric default 2,
  p_hospital text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  ambulance_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in to register an ambulance.'; end if;
  if exists (select 1 from public.ambulances where provider_user_id = auth.uid()) then raise exception 'This account already has a registered ambulance.'; end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_type), '') is null or nullif(trim(p_phone), '') is null or nullif(trim(p_location), '') is null then
    raise exception 'Name, type, phone, and location are required.';
  end if;
  if trim(p_phone) !~ '^[0-9]{11}$' then raise exception 'Enter an 11-digit phone number.'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Invalid station coordinates.'; end if;
  if p_base_fare < 0 or p_per_km_rate < 0 then raise exception 'Pricing cannot be negative.'; end if;
  update public.ambulances
  set provider_user_id = auth.uid(), updated_at = now()
  where provider_user_id is null and lower(trim(name)) = lower(trim(p_name)) and trim(coalesce(phone, '')) = trim(p_phone)
  returning id into ambulance_id;
  if ambulance_id is not null then return ambulance_id; end if;
  insert into public.ambulances (provider_user_id, name, type, phone, location, latitude, longitude, base_fare, per_km_rate, hospital)
  values (auth.uid(), trim(p_name), trim(p_type), trim(p_phone), trim(p_location), p_latitude, p_longitude, p_base_fare, p_per_km_rate, nullif(trim(p_hospital), ''))
  returning id into ambulance_id;
  return ambulance_id;
end;
$$;

grant execute on function public.register_ambulance(text, text, text, text, numeric, numeric, numeric, numeric, text) to authenticated;

create or replace function public.update_ambulance_request_status(p_request_id uuid, p_status text, p_final_distance_km numeric default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  request_row public.ambulance_requests;
  final_distance numeric;
begin
  select * into request_row from public.ambulance_requests where id = p_request_id;
  if not found then raise exception 'Ambulance request not found.'; end if;
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' and not exists (select 1 from public.ambulances where id = request_row.ambulance_id and provider_user_id = auth.uid()) then raise exception 'Only the ambulance provider can update this request.'; end if;
  if p_status not in ('requested', 'accepted', 'rejected', 'on_the_way', 'picked_up', 'arrived', 'completed', 'cancelled') then raise exception 'Invalid ambulance status.'; end if;
  final_distance := coalesce(p_final_distance_km, request_row.final_distance_km);
  update public.ambulance_requests set status = p_status, provider_location = case when p_status in ('accepted', 'on_the_way') then (select location from public.ambulances where id = request_row.ambulance_id) else provider_location end, provider_latitude = case when p_status in ('accepted', 'on_the_way') then (select latitude from public.ambulances where id = request_row.ambulance_id) else provider_latitude end, provider_longitude = case when p_status in ('accepted', 'on_the_way') then (select longitude from public.ambulances where id = request_row.ambulance_id) else provider_longitude end, estimated_arrival_at = case when p_status in ('accepted', 'on_the_way') then coalesce(estimated_arrival_at, now() + interval '15 minutes') else estimated_arrival_at end, accepted_at = case when p_status = 'accepted' then coalesce(accepted_at, now()) else accepted_at end, final_distance_km = case when p_status = 'completed' then final_distance else final_distance_km end, final_fare = case when p_status = 'completed' then round((base_fare + final_distance * per_km_rate)::numeric, 2) else final_fare end, pickup_at = case when p_status = 'picked_up' and pickup_at is null then now() else pickup_at end, completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else completed_at end, updated_at = now() where id = p_request_id;
  if p_status in ('accepted', 'on_the_way', 'picked_up', 'arrived') then update public.ambulances set status = 'busy', updated_at = now() where id = request_row.ambulance_id; end if;
  if p_status in ('completed', 'rejected', 'cancelled') then update public.ambulances set status = 'available', updated_at = now() where id = request_row.ambulance_id; end if;
end;
$$;

grant execute on function public.update_ambulance_request_status(uuid, text, numeric) to authenticated;

insert into public.ambulances (name, type, phone, location, latitude, longitude, base_fare, per_km_rate)
select 'FastCare Ambulance Service', 'ICU Ambulance', '999', 'Cox''s Bazar', 21.4272, 92.0058, 300, 2
where not exists (select 1 from public.ambulances);

notify pgrst, 'reload schema';
