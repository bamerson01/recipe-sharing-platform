# Database Functions & Triggers

## Overview

The RecipeNest platform uses PostgreSQL functions and triggers to implement business logic at the database level, ensuring data consistency, automatic maintenance of calculated fields, and optimized performance for common operations.

## Function Categories

### Count Maintenance Functions
Functions that automatically update cached counts for performance optimization.

### Search Vector Functions
Functions that maintain full-text search vectors for efficient recipe discovery.

### User Management Functions
Functions that handle user lifecycle events and profile management.

### Timestamp Functions
Functions that automatically maintain creation and modification timestamps.

## Core Functions

### Count Maintenance

#### `update_recipe_like_count()`
**Purpose**: Automatically maintains the `like_count` field in the `recipes` table

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.update_recipe_like_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update like count for the affected recipe
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes 
    SET like_count = like_count + 1 
    WHERE id = NEW.recipe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes 
    SET like_count = like_count - 1 
    WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Parameters**: None (trigger function)

**Return Type**: `TRIGGER`

**Business Logic**:
- **INSERT**: Increments like count when a new like is created
- **DELETE**: Decrements like count when a like is removed
- **UPDATE**: Not handled (likes are immutable once created)

**Performance Considerations**:
- Uses direct UPDATE statements for efficiency
- Avoids expensive COUNT() queries
- Maintains real-time accuracy of like counts

**Trigger Usage**:
```sql
CREATE TRIGGER recipe_like_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_recipe_like_count();
```

#### `update_follow_counts()`
**Purpose**: Automatically maintains follower and following counts in the `profiles` table

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update follower count for the followed user
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.followed_id;
    
    -- Update following count for the follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease follower count for the followed user
    UPDATE profiles 
    SET follower_count = follower_count - 1 
    WHERE id = OLD.followed_id;
    
    -- Decrease following count for the follower
    UPDATE profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Parameters**: None (trigger function)

**Return Type**: `TRIGGER`

**Business Logic**:
- **INSERT**: Increments both follower and following counts
- **DELETE**: Decrements both follower and following counts
- **UPDATE**: Not handled (follow relationships are immutable once created)

**Performance Considerations**:
- Updates both profiles in a single trigger execution
- Maintains consistency between follower and following counts
- Avoids expensive COUNT() queries for social metrics

**Trigger Usage**:
```sql
CREATE TRIGGER follow_counts_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();
```

#### `update_comment_like_count()`
**Purpose**: Automatically maintains the `like_count` field in the `recipe_comments` table

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update like count for the affected comment
  IF TG_OP = 'INSERT' THEN
    UPDATE recipe_comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipe_comments 
    SET like_count = like_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Parameters**: None (trigger function)

**Return Type**: `TRIGGER`

**Business Logic**:
- **INSERT**: Increments like count when a new comment like is created
- **DELETE**: Decrements like count when a comment like is removed
- **UPDATE**: Not handled (comment likes are immutable once created)

**Performance Considerations**:
- Uses direct UPDATE statements for efficiency
- Maintains real-time accuracy of comment like counts
- Supports nested comment like tracking

**Trigger Usage**:
```sql
CREATE TRIGGER comment_like_count_trigger
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_like_count();
```

### Search Vector Functions

#### `update_search_vector()`
**Purpose**: Automatically maintains the `search_vector` field in the `recipes` table for full-text search

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Update search vector with recipe title, summary, and ingredients
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', (
      SELECT string_agg(text, ' ')
      FROM recipe_ingredients
      WHERE recipe_id = NEW.id
    )), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Parameters**: None (trigger function)

**Return Type**: `TRIGGER`

**Business Logic**:
- **Title (A weight)**: Highest priority for search relevance
- **Summary (B weight)**: Medium priority for search relevance
- **Ingredients (C weight)**: Lower priority but important for ingredient-based searches
- **Automatic updates**: Triggers on INSERT and UPDATE operations

**Search Weighting**:
- **A weight (title)**: Most important for search ranking
- **B weight (summary)**: Secondary importance
- **C weight (ingredients)**: Tertiary importance but valuable for specific searches

**Performance Considerations**:
- Uses PostgreSQL's built-in full-text search capabilities
- Maintains search vectors automatically without manual intervention
- Supports complex search queries with ranking

**Trigger Usage**:
```sql
CREATE TRIGGER recipe_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();
```

#### `refresh_search_vector(recipe_id)`
**Purpose**: Manually refresh the search vector for a specific recipe (useful for bulk operations)

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.refresh_search_vector(recipe_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE recipes 
  SET search_vector = (
    SELECT 
      setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
      setweight(to_tsvector('english', (
        SELECT string_agg(text, ' ')
        FROM recipe_ingredients
        WHERE recipe_id = recipes.id
      )), 'C')
  )
  WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql;
```

**Parameters**:
- `recipe_id` (bigint): The ID of the recipe to refresh

**Return Type**: `void`

**Business Logic**:
- Manually updates search vector for a specific recipe
- Useful for bulk operations or data corrections
- Maintains search vector consistency

**Usage Examples**:
```sql
-- Refresh search vector for a specific recipe
SELECT refresh_search_vector(123);

-- Refresh search vectors for multiple recipes
SELECT refresh_search_vector(id) FROM recipes WHERE updated_at > '2025-01-01';
```

### User Management Functions

#### `handle_new_user()`
**Purpose**: Automatically creates a profile when a new user signs up

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || NEW.id),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Parameters**: None (trigger function)

**Return Type**: `TRIGGER`

**Business Logic**:
- **Automatic profile creation**: Creates profile immediately after user signup
- **Username generation**: Uses provided username or generates default
- **Display name**: Uses provided display name or defaults to email
- **Security**: Runs with elevated privileges to bypass RLS

**Profile Creation Logic**:
1. Extract username from user metadata
2. Fall back to generated username if none provided
3. Extract display name from user metadata
4. Fall back to email address if no display name
5. Create profile with minimal required information

**Trigger Usage**:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### `is_username_available(proposed_username)`
**Purpose**: Checks if a username is available for registration

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.is_username_available(proposed_username text)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = proposed_username
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

**Parameters**:
- `proposed_username` (text): The username to check for availability

**Return Type**: `boolean`

**Business Logic**:
- **Availability check**: Returns true if username is available
- **Case sensitivity**: Username comparison is case-sensitive
- **Performance**: Uses EXISTS for efficient checking
- **Stable function**: Can be used in index expressions

**Usage Examples**:
```sql
-- Check if username is available
SELECT is_username_available('john_doe');

-- Use in application logic
IF is_username_available(new_username) THEN
  -- Proceed with registration
ELSE
  -- Username already taken
END IF;
```

### Timestamp Functions

#### `touch_updated_at()`
**Purpose**: Automatically updates the `updated_at` timestamp when a record is modified

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Parameters**: None (trigger function)

**Return Type**: `TRIGGER`

**Business Logic**:
- **Automatic timestamp**: Updates `updated_at` on every modification
- **Before trigger**: Ensures timestamp is set before row is saved
- **Universal usage**: Can be applied to any table with `updated_at` field

**Performance Considerations**:
- Minimal overhead for timestamp updates
- Ensures data freshness tracking
- Supports cache invalidation strategies

**Trigger Usage**:
```sql
CREATE TRIGGER touch_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();
```

## Trigger Definitions

### Recipe-Related Triggers

#### `recipe_like_count_trigger`
**Table**: `public.likes`
**Events**: INSERT, DELETE
**Function**: `update_recipe_like_count()`
**Purpose**: Maintains recipe like counts automatically

#### `recipe_search_vector_trigger`
**Table**: `public.recipes`
**Events**: BEFORE INSERT, UPDATE
**Function**: `update_search_vector()`
**Purpose**: Updates search vectors for full-text search

#### `touch_recipes_updated_at`
**Table**: `public.recipes`
**Events**: BEFORE UPDATE
**Function**: `touch_updated_at()`
**Purpose**: Updates modification timestamp

### Social Feature Triggers

#### `follow_counts_trigger`
**Table**: `public.follows`
**Events**: AFTER INSERT, DELETE
**Function**: `update_follow_counts()`
**Purpose**: Maintains follower/following counts

#### `comment_like_count_trigger`
**Table**: `public.comment_likes`
**Events**: AFTER INSERT, DELETE
**Function**: `update_comment_like_count()`
**Purpose**: Maintains comment like counts

### User Management Triggers

#### `on_auth_user_created`
**Table**: `auth.users`
**Events**: AFTER INSERT
**Function**: `handle_new_user()`
**Purpose**: Creates profile for new users

## Performance Considerations

### Index Optimization
- **Search vectors**: GIN indexes for fast full-text search
- **Count fields**: B-tree indexes for efficient sorting and filtering
- **Timestamps**: B-tree indexes for chronological operations
- **Foreign keys**: Automatic indexes for join performance

### Query Optimization
- **Count maintenance**: Avoids expensive COUNT() queries
- **Batch operations**: Efficient for bulk data updates
- **Trigger efficiency**: Minimal overhead for automatic operations
- **Caching strategy**: Maintains frequently accessed counts

### Scalability Considerations
- **Large datasets**: Triggers scale with data volume
- **Concurrent access**: Handles multiple simultaneous operations
- **Memory usage**: Minimal memory footprint for trigger functions
- **Lock management**: Efficient locking for concurrent updates

## Maintenance & Monitoring

### Function Health Checks
```sql
-- Check function definitions
SELECT 
  proname as function_name,
  prosrc as source_code,
  prolang::regtype as language
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

-- Check trigger definitions
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid::regnamespace = 'public'::regnamespace;
```

### Performance Monitoring
```sql
-- Monitor trigger execution
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Check search vector performance
SELECT 
  schemaname,
  tablename,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' AND indexrelname LIKE '%search_vector%';
```

### Error Handling
- **Function errors**: Logged to PostgreSQL logs
- **Trigger failures**: Rollback transaction on error
- **Data consistency**: Maintains referential integrity
- **Recovery procedures**: Manual intervention for complex failures

## Future Enhancements

### Planned Functions
- **Recipe versioning**: Track recipe evolution over time
- **Advanced analytics**: User engagement and popularity metrics
- **Content moderation**: Automated content filtering and flagging
- **Performance optimization**: Query optimization and caching functions

### Advanced Features
- **Machine learning**: Recipe recommendations and similarity scoring
- **Real-time updates**: WebSocket integration for live data
- **Advanced search**: Semantic search and natural language processing
- **Data archiving**: Automatic archiving of old content

### Monitoring & Alerting
- **Performance alerts**: Monitor function execution times
- **Error tracking**: Comprehensive error logging and alerting
- **Health checks**: Automated database health monitoring
- **Capacity planning**: Resource usage tracking and forecasting
