-- Auto-profile creation for RecipeNest
-- This script sets up automatic profile creation when users sign up

-- 1) Profiles RLS (safe defaults)
alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_select_all') then
    create policy profiles_select_all on public.profiles for select using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_insert_self') then
    create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_update_self') then
    create policy profiles_update_self on public.profiles for update using (id = auth.uid());
  end if;
end $$;

-- 2) Trigger to create a profile whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, created_at)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    now()
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3) Backfill any missing profiles for existing auth users
insert into public.profiles (id, username, display_name, created_at)
select u.id,
       split_part(u.email,'@',1),
       split_part(u.email,'@',1),
       now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
