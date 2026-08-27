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

drop policy if exists "Authenticated users can view open request creator profiles" on public.profiles;
create policy "Authenticated users can view open request creator profiles"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.blood_requests request_row
    where request_row.user_id = profiles.id
      and request_row.status = 'open'
  )
);

create table if not exists public.blood_request_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  donor_user_id uuid references auth.users(id) on delete set null,
  notification_type text not null default 'general',
  status text not null default 'unread' check (status in ('unread', 'read', 'pending', 'accepted', 'declined', 'completed')),
  message text not null,
  read_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.blood_request_notifications add column if not exists donor_user_id uuid references auth.users(id) on delete set null;
alter table public.blood_request_notifications add column if not exists sender_user_id uuid references auth.users(id) on delete set null;
alter table public.blood_request_notifications add column if not exists notification_type text not null default 'general';
alter table public.blood_request_notifications add column if not exists status text not null default 'unread';

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'blood_request_notifications'
  ) then
    alter publication supabase_realtime add table public.blood_request_notifications;
  end if;
end;
$$;
alter table public.blood_request_notifications add column if not exists accepted_at timestamptz;
alter table public.blood_request_notifications add column if not exists rejected_at timestamptz;
alter table public.blood_request_notifications add column if not exists cleared_at timestamptz;

create table if not exists public.blood_donations (
  id uuid primary key default gen_random_uuid(),
  donor_user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.blood_requests(id) on delete set null,
  response_id uuid unique references public.blood_request_notifications(id) on delete set null,
  blood_group text,
  donation_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.blood_donation_requests (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete cascade,
  donor_user_id uuid not null references auth.users(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  response_id uuid references public.blood_request_notifications(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (blood_request_id, donor_user_id)
);

alter table public.blood_donation_requests enable row level security;

alter table public.blood_donor_applications add column if not exists total_donations integer not null default 0;

drop policy if exists "Users can view their donation requests" on public.blood_donation_requests;
create policy "Users can view their donation requests"
on public.blood_donation_requests for select
to authenticated
using (auth.uid() = donor_user_id or auth.uid() = requester_user_id);

drop policy if exists "Requesters can delete their donation requests" on public.blood_donation_requests;
create policy "Requesters can delete their donation requests"
on public.blood_donation_requests for delete
to authenticated
using (auth.uid() = requester_user_id);

drop policy if exists "Donors can update their donation requests" on public.blood_donation_requests;

create or replace function public.create_blood_donation_request(p_blood_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.blood_requests;
  donor_row public.blood_donor_applications;
  profile_blood_group text;
  donor_blood_group text;
  donation_request_id uuid;
  notification_id uuid;
begin
  select * into request_row from public.blood_requests where id = p_blood_request_id and status = 'open';
  if not found then raise exception 'This blood request is no longer open.'; end if;
  if request_row.user_id = auth.uid() then raise exception 'You cannot donate to your own request.'; end if;
  select * into donor_row from public.blood_donor_applications where user_id = auth.uid() and status = 'available';
  if not found then raise exception 'You must be an available registered donor.'; end if;
  select blood_group into profile_blood_group from public.profiles where id = auth.uid();
  donor_blood_group := coalesce(nullif(trim(profile_blood_group), ''), nullif(trim(donor_row.blood_group), ''));
  if lower(donor_blood_group) <> lower(trim(request_row.blood_group)) then raise exception 'Your blood group does not match this request.'; end if;

  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message)
  values (request_row.id, auth.uid(), request_row.user_id, auth.uid(), 'donation_response', 'unread', format('A matching %s donor wants to donate for %s.', donor_blood_group, request_row.patient_name))
  returning id into notification_id;

  insert into public.blood_donation_requests (blood_request_id, donor_user_id, requester_user_id, response_id)
  values (request_row.id, auth.uid(), request_row.user_id, notification_id)
  on conflict (blood_request_id, donor_user_id) do update set status = 'pending', response_id = excluded.response_id
  returning id into donation_request_id;
  return donation_request_id;
end;
$$;

create or replace function public.complete_blood_donation_request(p_donation_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  donation_request public.blood_donation_requests;
  request_row public.blood_requests;
begin
  select * into donation_request from public.blood_donation_requests
  where id = p_donation_request_id and donor_user_id = auth.uid() and status in ('pending', 'accepted');
  if not found then raise exception 'This donation request is no longer active.'; end if;
  select * into request_row from public.blood_requests where id = donation_request.blood_request_id;
  insert into public.blood_donations (donor_user_id, request_id, response_id, blood_group, donation_date)
  values (auth.uid(), donation_request.blood_request_id, donation_request.response_id, request_row.blood_group, coalesce(request_row.donation_date, current_date))
  on conflict (response_id) do nothing;
  update public.blood_donor_applications
  set last_donation_date = coalesce(request_row.donation_date, current_date), total_donations = coalesce(total_donations, 0) + 1, status = 'available'
  where user_id = auth.uid();
  update public.blood_donation_requests set status = 'completed', completed_at = now() where id = donation_request.id;
  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message)
  values (request_row.id, donation_request.requester_user_id, auth.uid(), auth.uid(), 'donation_completed', 'unread', 'Thank you very much for donating blood.')
  on conflict do nothing;
end;
$$;

grant execute on function public.create_blood_donation_request(uuid) to authenticated;

create or replace function public.request_blood_donation_from_donor(p_donor_user_id uuid, p_blood_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.blood_requests;
  donor_row public.blood_donor_applications;
  donation_request_id uuid;
  notification_id uuid;
begin
  select * into request_row from public.blood_requests
  where id = p_blood_request_id and user_id = auth.uid() and status = 'open';
  if not found then raise exception 'Select one of your open blood requests.'; end if;
  if p_donor_user_id = auth.uid() then raise exception 'You cannot request yourself.'; end if;
  select * into donor_row from public.blood_donor_applications
  where user_id = p_donor_user_id;
  if not found then raise exception 'This donor is no longer registered.'; end if;
  if not (lower(coalesce(donor_row.gender, '')) in ('male', 'female') and donor_row.last_donation_date + interval '120 days' <= current_date) then
    raise exception 'This donor is not currently eligible.';
  end if;

  delete from public.blood_request_notifications
  where request_id = request_row.id and recipient_user_id = p_donor_user_id and donor_user_id is null;

  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message)
  values (request_row.id, auth.uid(), p_donor_user_id, p_donor_user_id, 'donation_request', 'pending',
    format('%s needs %s blood. Please review their request.', request_row.patient_name, request_row.blood_group))
  returning id into notification_id;

  insert into public.blood_donation_requests (blood_request_id, donor_user_id, requester_user_id, response_id)
  values (request_row.id, p_donor_user_id, auth.uid(), notification_id)
  returning id into donation_request_id;
  return donation_request_id;
exception
  when unique_violation then
    raise exception 'You already requested this donor for this blood request.';
end;
$$;

grant execute on function public.request_blood_donation_from_donor(uuid, uuid) to authenticated;

create or replace function public.mark_blood_donation_given(p_donation_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  donation_request public.blood_donation_requests;
  request_row public.blood_requests;
begin
  select * into donation_request from public.blood_donation_requests
  where id = p_donation_request_id and requester_user_id = auth.uid() and status in ('pending', 'accepted');
  if not found then raise exception 'This donation request is no longer active.'; end if;
  select * into request_row from public.blood_requests where id = donation_request.blood_request_id;
  insert into public.blood_donations (donor_user_id, request_id, response_id, blood_group, donation_date)
  values (donation_request.donor_user_id, donation_request.blood_request_id, donation_request.response_id, request_row.blood_group, current_date)
  on conflict (response_id) do nothing;
  update public.blood_donor_applications
  set last_donation_date = current_date, total_donations = coalesce(total_donations, 0) + 1, status = 'available'
  where user_id = donation_request.donor_user_id;
  update public.blood_donation_requests set status = 'completed', completed_at = now() where id = donation_request.id;
  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message)
  values (request_row.id, auth.uid(), donation_request.donor_user_id, donation_request.donor_user_id, 'donation_completed', 'unread', 'Thank you very much for donating blood.');
end;
$$;

grant execute on function public.mark_blood_donation_given(uuid) to authenticated;

create or replace function public.accept_incoming_blood_request(p_response_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_row public.blood_request_notifications;
  request_row public.blood_requests;
  donor_row public.blood_donor_applications;
begin
  select * into notification_row from public.blood_request_notifications
  where id = p_response_id and recipient_user_id = auth.uid()
    and donor_user_id = auth.uid() and accepted_at is null and rejected_at is null;
  if not found then raise exception 'This donor request is no longer available.'; end if;
  select * into request_row from public.blood_requests where id = notification_row.request_id;
  select * into donor_row from public.blood_donor_applications where user_id = auth.uid();
  update public.blood_request_notifications set accepted_at = now(), read_at = now(), status = 'accepted' where id = notification_row.id;
  update public.blood_donation_requests set status = 'accepted'
  where response_id = notification_row.id and donor_user_id = auth.uid() and status in ('pending', 'accepted');
  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message, accepted_at)
  values (request_row.id, auth.uid(), request_row.user_id, auth.uid(), 'donation_confirmation_required', 'unread', format('Your blood request was accepted by %s. Contact: %s, Location: %s, Blood group: %s.', donor_row.full_name, donor_row.phone, donor_row.location, donor_row.blood_group), now());
end;
$$;

grant execute on function public.accept_incoming_blood_request(uuid) to authenticated;

create or replace function public.decline_incoming_blood_request(p_response_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_row public.blood_request_notifications;
  request_row public.blood_requests;
begin
  select * into notification_row from public.blood_request_notifications
  where id = p_response_id and recipient_user_id = auth.uid()
    and donor_user_id = auth.uid() and accepted_at is null and rejected_at is null;
  if not found then raise exception 'This donor request is no longer available.'; end if;
  select * into request_row from public.blood_requests where id = notification_row.request_id;
  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message, rejected_at)
  values (request_row.id, auth.uid(), request_row.user_id, auth.uid(), 'donation_declined', 'unread', 'Your blood request was declined by the donor. You can send it to another donor.', now());
  update public.blood_request_notifications
  set rejected_at = now(), read_at = now(), status = 'declined'
  where id = notification_row.id;
  update public.blood_donation_requests
  set status = 'declined'
  where response_id = notification_row.id and donor_user_id = auth.uid();
end;
$$;

grant execute on function public.decline_incoming_blood_request(uuid) to authenticated;

grant execute on function public.complete_blood_donation_request(uuid) to authenticated;

alter table public.blood_donations enable row level security;

drop policy if exists "Users can view their own donations" on public.blood_donations;
create policy "Users can view their own donations"
on public.blood_donations for select
to authenticated
using (auth.uid() = donor_user_id);

drop policy if exists "Users can create their own donations" on public.blood_donations;

create or replace function public.accept_blood_response(p_response_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  response_row public.blood_request_notifications;
begin
  select * into response_row
  from public.blood_request_notifications
  where id = p_response_id
    and recipient_user_id = auth.uid()
    and donor_user_id is not null
    and accepted_at is null
    and rejected_at is null;
  if not found then raise exception 'This donor response is no longer available.'; end if;

  update public.blood_request_notifications
  set accepted_at = now()
  where id = response_row.id;
  update public.blood_donation_requests
  set status = 'accepted'
  where response_id = response_row.id;
end;
$$;

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
    and lower(coalesce(donor.gender, '')) in ('male', 'female')
    and donor.last_donation_date + interval '120 days' <= current_date;

  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, notification_type, status, message)
  select new.id, new.user_id, donor.user_id, 'new_blood_request', 'unread',
    format('New %s blood request near %s. Please check LifeLink.', new.blood_group, new.district)
  from public.blood_donor_applications donor
  where donor.status = 'available'
    and donor.blood_group = new.blood_group
    and (lower(coalesce(donor.district, '')) = lower(new.district)
      or lower(coalesce(donor.division, '')) = lower(new.division))
    and lower(coalesce(donor.gender, '')) in ('male', 'female')
    and donor.last_donation_date + interval '120 days' <= current_date;

  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, notification_type, status, message)
  values (new.id, new.user_id, new.user_id, 'match_summary', 'unread', format('%s eligible donor%s matched your blood request.', matched_count, case when matched_count = 1 then '' else 's' end));

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
  profile_blood_group text;
  donor_blood_group text;
begin
  select * into request_row from public.blood_requests where id = p_request_id and status = 'open';
  if not found then raise exception 'This blood request is no longer open.'; end if;
  select * into donor_row from public.blood_donor_applications where user_id = auth.uid() and status = 'available';
  if not found then raise exception 'You must be an available registered donor.'; end if;
  select blood_group into profile_blood_group from public.profiles where id = auth.uid();
  donor_blood_group := coalesce(nullif(trim(profile_blood_group), ''), nullif(trim(donor_row.blood_group), ''));
  if lower(donor_blood_group) <> lower(trim(request_row.blood_group)) then raise exception 'Your blood group does not match this request.'; end if;
  if not (lower(coalesce(donor_row.gender, '')) in ('male', 'female') and donor_row.last_donation_date + interval '120 days' <= current_date) then
    raise exception 'You are not currently eligible to donate.';
  end if;
  insert into public.blood_request_notifications (request_id, sender_user_id, recipient_user_id, donor_user_id, notification_type, status, message)
  values (request_row.id, auth.uid(), request_row.user_id, donor_row.user_id, 'donation_response', 'unread', format('A matching %s donor wants to donate for %s. Contact: %s', donor_blood_group, request_row.patient_name, donor_row.phone));
end;
$$;

grant execute on function public.accept_blood_response(uuid) to authenticated;
notify pgrst, 'reload schema';
