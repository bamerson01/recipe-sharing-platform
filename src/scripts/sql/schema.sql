-- Extensions
create extension if not exists pg_trgm;

-- profiles mirrors auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.recipes (
  id bigserial primary key,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  summary text,
  image_path text,
  is_public boolean default false,
  like_count int default 0,
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recipe_ingredients (
  id bigserial primary key,
  recipe_id bigint references public.recipes(id) on delete cascade,
  position int not null,
  text text not null
);

create table if not exists public.recipe_steps (
  id bigserial primary key,
  recipe_id bigint references public.recipes(id) on delete cascade,
  position int not null,
  text text not null
);

create table if not exists public.recipe_categories (
  recipe_id bigint references public.recipes(id) on delete cascade,
  category_id bigint references public.categories(id) on delete cascade,
  primary key (recipe_id, category_id)
);

create table if not exists public.likes (
  id bigserial primary key,
  recipe_id bigint references public.recipes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (recipe_id, user_id)
);

-- Search vector + indexes
create index if not exists recipes_search_gin on public.recipes using gin(search_vector);
create index if not exists recipes_title_trgm on public.recipes using gin (title gin_trgm_ops);

-- Keep search_vector fresh
create or replace function public.set_recipes_search_vector() returns trigger as $$
begin
  new.search_vector :=
    to_tsvector('simple', coalesce(new.title,'') || ' ' || coalesce(new.summary,''));
  return new;
end; $$ language plpgsql;

create trigger recipes_tsv before insert or update
on public.recipes for each row execute procedure public.set_recipes_search_vector();

-- Auto-update updated_at
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end; $$ language plpgsql;

create trigger recipes_touch before update on public.recipes
for each row execute procedure public.touch_updated_at();

-- Like count maintenance
create or replace function public.bump_like_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.recipes set like_count = like_count + 1 where id = new.recipe_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.recipes set like_count = like_count - 1 where id = old.recipe_id;
    return old;
  end if;
  return null;
end; $$ language plpgsql;

create trigger likes_count_ins after insert on public.likes
for each row execute procedure public.bump_like_count();

create trigger likes_count_del after delete on public.likes
for each row execute procedure public.bump_like_count();

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_categories enable row level security;
alter table public.likes enable row level security;

-- RLS Policies

-- PROFILES
create policy profiles_read on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- CATEGORIES
create policy categories_read on public.categories for select using (true);

-- RECIPES
create policy recipes_read on public.recipes for select using (
  is_public = true or author_id = auth.uid()
);
create policy recipes_insert on public.recipes for insert with check (auth.role() = 'authenticated');
create policy recipes_update on public.recipes for update using (author_id = auth.uid());
create policy recipes_delete on public.recipes for delete using (author_id = auth.uid());

-- INGREDIENTS
create policy ing_read on public.recipe_ingredients for select using (
  exists (select 1 from public.recipes r where r.id = recipe_id and (r.is_public or r.author_id = auth.uid()))
);
create policy ing_write on public.recipe_ingredients for all using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
) with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
);

-- STEPS
create policy steps_read on public.recipe_steps for select using (
  exists (select 1 from public.recipes r where r.id = recipe_id and (r.is_public or r.author_id = auth.uid()))
);
create policy steps_write on public.recipe_steps for all using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
) with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
);

-- RECIPE_CATEGORIES
create policy rc_read on public.recipe_categories for select using (
  exists (select 1 from public.recipes r where r.id = recipe_id and (r.is_public or r.author_id = auth.uid()))
);
create policy rc_write on public.recipe_categories for all using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
) with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
);

-- LIKES
create policy likes_read on public.likes for select using (true);
create policy likes_insert on public.likes for insert with check (auth.role() = 'authenticated');
create policy likes_delete on public.likes for delete using (user_id = auth.uid());
