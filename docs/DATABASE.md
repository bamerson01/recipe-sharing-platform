# Database Schema Documentation

## Overview
RecipeNest uses Supabase (PostgreSQL) with Row Level Security (RLS) for data management. This document outlines the database schema, relationships, and important conventions.

## Schema Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   profiles  │────<│    follows   │>────│  profiles   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                                         
       │ 1:N                                     
       ↓                                         
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   recipes   │────<│    likes     │>────│  profiles   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   
       │ 1:N               
       ↓                   
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│recipe_steps │     │    saves     │>────│  profiles   │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ 1:N
       ↓
┌──────────────────┐     ┌──────────────┐     ┌─────────────┐
│recipe_ingredients│────<│recipe_categories│>──│ categories  │
└──────────────────┘     └──────────────┘     └─────────────┘
```

## Core Tables

### profiles
User profile information, automatically created on signup.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_key TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Notes:**
- `id` references Supabase Auth user ID
- `username` must be unique across the platform
- `avatar_key` stores the Storage path, not URL
- Follower/following counts are denormalized for performance

### recipes
Core recipe data.

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  cover_image_key TEXT,
  is_public BOOLEAN DEFAULT true,
  like_count INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Points:**
- `slug` is auto-generated from title for SEO-friendly URLs
- `like_count` is denormalized for performance
- `cover_image_key` references Storage bucket path

### follows
User following relationships.

```sql
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
```

**⚠️ CRITICAL: Column Naming Convention**
- `follower_id`: The user who is following
- `following_id`: The user being followed
- **NOT** `followed_id` - this is a common mistake in the codebase

### likes
Recipe likes/favorites.

```sql
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);
```

### saves
Recipes saved to user's cookbook.

```sql
CREATE TABLE saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);
```

### recipe_ingredients
Ingredients for each recipe.

```sql
CREATE TABLE recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### recipe_steps
Cooking instructions.

```sql
CREATE TABLE recipe_steps (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### recipe_categories
Many-to-many relationship between recipes and categories.

```sql
CREATE TABLE recipe_categories (
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, category_id)
);
```

### categories
Predefined recipe categories.

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### recipe_comments
User comments on recipes.

```sql
CREATE TABLE recipe_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes

Critical indexes for performance:

```sql
-- Profile lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Recipe queries
CREATE INDEX idx_recipes_author ON recipes(author_id);
CREATE INDEX idx_recipes_public ON recipes(is_public);
CREATE INDEX idx_recipes_created ON recipes(created_at DESC);
CREATE INDEX idx_recipes_likes ON recipes(like_count DESC);

-- Relationship queries
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_recipe ON likes(recipe_id);
CREATE INDEX idx_saves_user ON saves(user_id);
CREATE INDEX idx_saves_recipe ON saves(recipe_id);

-- Category relationships
CREATE INDEX idx_recipe_categories_recipe ON recipe_categories(recipe_id);
CREATE INDEX idx_recipe_categories_category ON recipe_categories(category_id);
```

## Row Level Security (RLS) Policies

### profiles
- **SELECT**: Anyone can view profiles
- **UPDATE**: Users can only update their own profile
- **INSERT**: Handled by trigger on auth.users

### recipes
- **SELECT**: Public recipes visible to all, private only to author
- **INSERT**: Authenticated users only
- **UPDATE/DELETE**: Authors only

### follows
- **SELECT**: Anyone can view follow relationships
- **INSERT/DELETE**: Authenticated users for their own follows

### likes/saves
- **SELECT**: Anyone can view counts
- **INSERT/DELETE**: Authenticated users for their own likes/saves

## Database Triggers

### Auto-create profile on signup
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Update follower/following counts
```sql
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 
    WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = follower_count - 1 
    WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Update like counts
```sql
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET like_count = like_count + 1 
    WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET like_count = like_count - 1 
    WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## Common Queries

### Get user with stats
```sql
SELECT 
  p.*,
  (SELECT COUNT(*) FROM recipes WHERE author_id = p.id) as recipe_count,
  (SELECT COUNT(*) FROM saves WHERE user_id = p.id) as saved_count
FROM profiles p
WHERE p.username = $1;
```

### Get recipe with all data
```sql
SELECT 
  r.*,
  p.username, p.display_name, p.avatar_key,
  array_agg(DISTINCT c.name) as categories,
  array_agg(DISTINCT ri.text ORDER BY ri.position) as ingredients,
  array_agg(DISTINCT rs.text ORDER BY rs.position) as steps
FROM recipes r
JOIN profiles p ON r.author_id = p.id
LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
LEFT JOIN categories c ON rc.category_id = c.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_steps rs ON r.id = rs.recipe_id
WHERE r.id = $1
GROUP BY r.id, p.username, p.display_name, p.avatar_key;
```

## Storage Buckets

### public-media
Stores all user-uploaded content:
- `/avatars/[user_id]/[filename]` - User profile pictures
- `/recipes/[recipe_id]/[filename]` - Recipe images

**Bucket Policy:**
- Public read access
- Authenticated users can upload to their own paths
- 5MB file size limit
- Allowed types: jpg, jpeg, png, webp

## Migrations

All database migrations are stored in `/database/` directory:
- `add_following_system.sql` - Initial follow system
- `add_recipe_time_difficulty.sql` - Recipe metadata
- `fix_unique_username_trigger.sql` - Username constraints
- `fix_likes_saves_system.sql` - Engagement features

## Best Practices

1. **Always use foreign keys** for referential integrity
2. **Create indexes** for columns used in WHERE, JOIN, ORDER BY
3. **Denormalize counts** for performance (likes, followers)
4. **Use triggers** to maintain denormalized data
5. **Implement RLS** for security
6. **Use transactions** for multi-table operations
7. **Avoid N+1 queries** by batch fetching

## Common Pitfalls

1. ❌ Using `followed_id` instead of `following_id`
2. ❌ Forgetting to handle cascade deletes
3. ❌ Missing indexes on foreign keys
4. ❌ Not updating denormalized counts
5. ❌ Bypassing RLS in client code

## Performance Tips

1. Use `select()` with specific columns instead of `*`
2. Batch fetch related data with single queries
3. Use database views for complex repeated queries
4. Monitor slow query logs
5. Add `EXPLAIN ANALYZE` to debug query performance