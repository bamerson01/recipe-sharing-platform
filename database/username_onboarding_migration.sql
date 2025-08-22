-- Username Onboarding Migration
-- Implements best-practice username handling: auth ID as primary, public handle via onboarding
-- Run this in Supabase SQL Editor

-- A1) Enable RLS with safe defaults
alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_select_all') then
    create policy profiles_select_all on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_insert_self') then
    create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_update_self') then
    create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
  end if;
end $$;

-- A2) Replace the default trigger: create shell profile with username NULL
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio, avatar_key, created_at)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), 'User'),
    null,
    null,
    now()
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- A3) Drop existing unique constraint on username if it exists
alter table public.profiles drop constraint if exists profiles_username_key;

-- A4) Create case-insensitive uniqueness for username (allows NULLs)
drop index if exists profiles_username_lower_key;
create unique index profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

-- A5) Backfill shell profiles for existing auth users without profiles
insert into public.profiles (id, display_name, created_at)
select u.id, 
       coalesce(split_part(u.email,'@',1), 'User'), 
       now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- A6) Create function to check username availability (case-insensitive)
create or replace function public.is_username_available(proposed_username text)
returns boolean
language plpgsql
security definer
as $$
begin
  return not exists (
    select 1 from public.profiles 
    where lower(username) = lower(proposed_username)
  );
end; $$;

-- Verification queries
select 'Profiles without usernames: ' || count(*)::text as status
from public.profiles where username is null;

select 'Total profiles: ' || count(*)::text as status
from public.profiles;