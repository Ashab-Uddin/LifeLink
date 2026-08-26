create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_name text not null,
  blood_group text not null,
  division text not null,
  district text not null,
  upazila text,
  address text,
  donation_center text not null,
  contact_number text not null,
  whatsapp_number text,
  blood_amount_bags numeric not null default 1 check (blood_amount_bags > 0),
  donation_date date not null,
  donation_time time not null,
  hemoglobin numeric,
  patient_problem text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.blood_requests enable row level security;

drop policy if exists "Users can create their own blood requests" on public.blood_requests;
create policy "Users can create their own blood requests"
on public.blood_requests for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own blood requests" on public.blood_requests;
create policy "Users can view their own blood requests"
on public.blood_requests for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own blood requests" on public.blood_requests;
create policy "Users can delete their own blood requests"
on public.blood_requests for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update their own blood requests" on public.blood_requests;
create policy "Users can update their own blood requests"
on public.blood_requests for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can view open blood requests" on public.blood_requests;
create policy "Authenticated users can view open blood requests"
on public.blood_requests for select
to authenticated
using (status = 'open');

create table if not exists public.blood_request_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  donor_user_id uuid references auth.users(id) on delete set null,
  message text not null,
  read_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.blood_request_notifications add column if not exists donor_user_id uuid references auth.users(id) on delete set null;
alter table public.blood_request_notifications add column if not exists accepted_at timestamptz;
alter table public.blood_request_notifications add column if not exists rejected_at timestamptz;

alter table public.blood_request_notifications enable row level security;

drop policy if exists "Users can view their blood request notifications" on public.blood_request_notifications;
create policy "Users can view their blood request notifications"
on public.blood_request_notifications for select
to authenticated
using (auth.uid() = recipient_user_id);

drop policy if exists "Users can update their blood request notifications" on public.blood_request_notifications;
create policy "Users can update their blood request notifications"
on public.blood_request_notifications for update
to authenticated
using (auth.uid() = recipient_user_id)
with check (auth.uid() = recipient_user_id);

create or replace function public.notify_matching_blood_donors()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_count integer;
begin
  select count(*) into matched_count
  from public.blood_donor_applications donor
  where donor.status = 'available'
    and donor.blood_group = new.blood_group
    and (lower(coalesce(donor.district, '')) = lower(new.district)
      or lower(coalesce(donor.division, '')) = lower(new.division))
    and (
      (lower(coalesce(donor.gender, '')) = 'male' and donor.last_donation_date + interval '4 months' <= current_date)
      or (lower(coalesce(donor.gender, '')) = 'female' and donor.last_donation_date + interval '6 months' <= current_date)
    );

  insert into public.blood_request_notifications (request_id, recipient_user_id, message)
  select new.id, donor.user_id,
    format('New %s blood request near %s. Please check LifeLink.', new.blood_group, new.district)
  from public.blood_donor_applications donor
  where donor.status = 'available'
    and donor.blood_group = new.blood_group
    and (lower(coalesce(donor.district, '')) = lower(new.district)
      or lower(coalesce(donor.division, '')) = lower(new.division))
    and (
      (lower(coalesce(donor.gender, '')) = 'male' and donor.last_donation_date + interval '4 months' <= current_date)
      or (lower(coalesce(donor.gender, '')) = 'female' and donor.last_donation_date + interval '6 months' <= current_date)
    );

  insert into public.blood_request_notifications (request_id, recipient_user_id, message)
  values (new.id, new.user_id, format('%s eligible donor%s matched your blood request.', matched_count, case when matched_count = 1 then '' else 's' end));

  return new;
end;
$$;

drop trigger if exists blood_request_match_notifications on public.blood_requests;
create trigger blood_request_match_notifications
after insert on public.blood_requests
for each row execute function public.notify_matching_blood_donors();

create or replace function public.respond_to_blood_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.blood_requests;
  donor_row public.blood_donor_applications;
begin
  select * into request_row from public.blood_requests where id = p_request_id and status = 'open';
  if not found then raise exception 'This blood request is no longer open.'; end if;
  select * into donor_row from public.blood_donor_applications where user_id = auth.uid() and status = 'available';
  if not found then raise exception 'You must be an available registered donor.'; end if;
  if donor_row.blood_group <> request_row.blood_group then raise exception 'Your blood group does not match this request.'; end if;
  if not ((lower(coalesce(donor_row.gender, '')) = 'male' and donor_row.last_donation_date + interval '4 months' <= current_date)
    or (lower(coalesce(donor_row.gender, '')) = 'female' and donor_row.last_donation_date + interval '6 months' <= current_date)) then
    raise exception 'You are not currently eligible to donate.';
  end if;
  insert into public.blood_request_notifications (request_id, recipient_user_id, donor_user_id, message)
  values (request_row.id, request_row.user_id, donor_row.user_id, format('A matching %s donor wants to donate for %s. Contact: %s', donor_row.blood_group, request_row.patient_name, donor_row.phone));
end;
$$;
