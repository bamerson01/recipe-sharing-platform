-- Fix for unique username constraint violations during user signup
-- This replaces the existing handle_new_user trigger with one that handles username collisions

-- Drop the existing trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Create improved function that handles unique username generation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  new_username text;
  username_counter int := 0;
begin
  -- Generate base username from email or metadata
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );
  
  -- Sanitize username (remove special characters, lowercase)
  base_username := lower(base_username);
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '_', 'g');
  base_username := regexp_replace(base_username, '_{2,}', '_', 'g');
  base_username := regexp_replace(base_username, '^_|_$', '', 'g');
  base_username := left(base_username, 30); -- Limit length
  
  -- Start with the base username
  new_username := base_username;
  
  -- Check for uniqueness and append numbers if needed
  loop
    -- Try to insert with current username
    begin
      insert into public.profiles (id, username, display_name, bio, avatar_key, created_at)
      values (
        new.id,
        new_username,
        coalesce(nullif(new.raw_user_meta_data->>'name', ''), new_username),
        null,
        null,
        now()
      );
      
      -- If insert succeeded, exit the loop
      exit;
      
    exception
      when unique_violation then
        -- Username already exists, try with a number
        username_counter := username_counter + 1;
        
        if username_counter > 99 then
          -- If we've tried too many times, use a unique suffix
          new_username := base_username || '_' || substr(new.id::text, 1, 8);
          
          -- Try one more time with the UUID-based username
          insert into public.profiles (id, username, display_name, bio, avatar_key, created_at)
          values (
            new.id,
            new_username,
            coalesce(nullif(new.raw_user_meta_data->>'name', ''), new_username),
            null,
            null,
            now()
          )
          on conflict (id) do nothing;
          
          exit;
        else
          -- Try with the next number
          new_username := base_username || username_counter::text;
        end if;
    end;
  end loop;
  
  return new;
exception
  when others then
    -- Log the error but don't fail the signup
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    
    -- Try one last time with a guaranteed unique username
    insert into public.profiles (id, username, display_name, bio, avatar_key, created_at)
    values (
      new.id,
      'user_' || substr(new.id::text, 1, 8),
      coalesce(nullif(new.raw_user_meta_data->>'name', ''), 'User'),
      null,
      null,
      now()
    )
    on conflict (id) do nothing;
    
    return new;
end; $$;

-- Recreate the trigger
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Optional: Fix existing duplicate username issues
-- This will rename any existing duplicate usernames by appending numbers
do $$
declare
  dup record;
  counter int;
  new_username text;
begin
  -- Find all usernames that have duplicates
  for dup in (
    select username, array_agg(id order by created_at) as ids
    from public.profiles
    where username is not null
    group by username
    having count(*) > 1
  ) loop
    counter := 1;
    
    -- Skip the first user (they keep the original username)
    for i in 2..array_length(dup.ids, 1) loop
      new_username := dup.username || counter::text;
      
      -- Check if this new username already exists
      while exists(select 1 from public.profiles where username = new_username) loop
        counter := counter + 1;
        new_username := dup.username || counter::text;
      end loop;
      
      -- Update the duplicate user's username
      update public.profiles
      set username = new_username
      where id = dup.ids[i];
      
      counter := counter + 1;
    end loop;
  end loop;
end $$;

-- Verify the fix
select 'Profiles with duplicate usernames (should be 0): ' || count(*)::text as status
from (
  select username
  from public.profiles
  where username is not null
  group by username
  having count(*) > 1
) as duplicates;