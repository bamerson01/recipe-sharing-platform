# Database Context

## Current Database State

### Tables Status
- ✅ **profiles** - User profiles with avatars and bios
- ✅ **recipes** - Recipe data with cover images and search vectors
- ✅ **categories** - Recipe categories
- ✅ **recipe_categories** - Many-to-many relationship table
- ✅ **recipe_ingredients** - Recipe ingredients
- ✅ **recipe_steps** - Recipe preparation steps
- ✅ **likes** - User likes on recipes
- ✅ **saves** - User saves/bookmarks
- ✅ **recipe_comments** - Comments on recipes
- ✅ **follows** - User follow relationships

### Foreign Key Constraints Status

#### ✅ Working (Detected by Supabase)
- **recipe_comments** → **profiles** (via `recipe_comments_user_id_fkey`)
- **recipe_comments** → **recipes** (via `recipe_comments_recipe_id_fkey`)

#### ❌ Not Working (Not Detected by Supabase)
- **follows** → **profiles** (constraints exist but not recognized)
- **likes** → **profiles** (constraints exist but not recognized)
- **likes** → **recipes** (constraints exist but not recognized)

### Current Solution: Manual Joins
Due to Supabase's schema cache not recognizing the foreign key constraints for `follows` and `likes` tables, the application now uses **manual joins** instead of automatic foreign key relationships.

#### How Manual Joins Work:
1. **Fetch relationship data** (follows, likes, comments)
2. **Extract related IDs** (follower_id, user_id, recipe_id)
3. **Fetch related data** (profiles, recipes) using `IN` clauses
4. **Transform and combine** data manually with Map-based lookups

#### Benefits:
- ✅ **Immediate functionality** without database fixes
- ✅ **More reliable** than depending on schema cache
- ✅ **Better performance** with batch queries
- ✅ **Full control** over data fetching process

### Database Schema Issues

#### Foreign Key Constraint Problem
**Issue**: Supabase cannot detect foreign key relationships for `follows` and `likes` tables, even though the constraints exist in the database.

**Evidence**:
- User reports: `ERROR: 42710: constraint "follows_follower_id_fkey" for relation "follows" already exists`
- Application tests: `Could not find a relationship between 'follows' and 'profiles' in the schema cache`

#### Column Naming Inconsistency (Fixed)
**Issue**: Some API routes were still referencing the old column name `following_id` instead of the renamed `followed_id`.

**Files Fixed**:
- `src/app/api/feed/following/route.ts` - Updated to use `followed_id` consistently

**Possible Causes**:
1. **Schema cache mismatch** - Supabase needs to refresh its internal schema
2. **Constraint naming** - Constraint names don't match what Supabase expects
3. **Table references** - Constraints might reference wrong tables (e.g., `auth.users` instead of `profiles`)

#### Attempted Solutions
1. ✅ **Manual joins implementation** - Working solution
2. ❌ **Foreign key constraint fixes** - Constraints already exist
3. ❌ **Constraint name variations** - All variations failed

### RLS Policies Status
- ✅ **profiles** - Owner can read/write own profile, public read for others
- ✅ **recipes** - Owner can read/write own recipes, public read for public recipes
- ✅ **likes** - Public read, owner can insert/delete own likes
- ✅ **saves** - Owner-only access (read/insert/delete)
- ✅ **recipe_comments** - Public read, owner can insert/delete own comments
- ✅ **follows** - Public read for counts, owner can manage own follows

### Functions and Triggers Status
- ✅ **update_recipe_like_count()** - Trigger function for maintaining like counts
- ✅ **update_search_vector()** - Trigger function for search vector updates
- ✅ **recipe_like_count_trigger** - Trigger on likes table
- ✅ **recipe_search_vector_trigger** - Trigger on recipes table

### Storage Buckets Status
- ✅ **public-media** - Recipe cover images
- ✅ **avatars** - User profile pictures
- ✅ **temp-uploads** - Temporary file storage

## Recent Changes

### 2025-01-22 - Foreign Key Constraint Fixes
- **Problem**: Interaction and connection pages failing to load data
- **Root Cause**: Supabase not recognizing foreign key constraints
- **Solution**: Implemented manual joins in server actions
- **Status**: ✅ Resolved and working

### 2025-01-22 - Dashboard UX Refresh
- **New Pages**: Added interaction and connection pages
- **Navigation**: Made dashboard stat cards clickable
- **URL Structure**: Updated saved recipes to `/saved-recipes`

### 2025-01-21 - Search & Filtering
- **Full-text Search**: Implemented with PostgreSQL tsvector
- **Category Filters**: Added with cursor pagination
- **Sort Options**: Top and Newest tabs on Explore page

### 2025-01-20 - Likes & Saves System
- **Likes**: Public kudos system with counts
- **Saves**: Private bookmarks system
- **UI Integration**: Added to recipe cards and pages

## Next Steps

### Immediate (Completed)
- ✅ Fix data loading issues with manual joins
- ✅ Test all interaction and connection pages
- ✅ Verify dashboard navigation functionality

### Short Term
- **Database Investigation**: Determine why foreign key constraints aren't detected
- **Schema Refresh**: Attempt to refresh Supabase's schema cache
- **Constraint Verification**: Verify constraint names and references

### Long Term
- **Performance Optimization**: Monitor manual join performance
- **Schema Alignment**: Align database schema with Supabase expectations
- **Documentation**: Update technical documentation with lessons learned

## Debug Endpoints

### Available Debug Routes
- `/api/debug/test-tables` - Check table existence and data counts
- `/api/debug/test-server-actions` - Test server action functionality
- `/api/debug/test-foreign-keys` - Test foreign key relationships
- `/api/debug/test-constraint-names` - Test different constraint name variations
- `/api/debug/test-fixed-actions` - Test the fixed server actions

### Usage
These endpoints help diagnose database and application issues:
```bash
# Test if tables exist and have data
curl http://localhost:3002/api/debug/test-tables

# Test if server actions are working
curl http://localhost:3002/api/debug/test-server-actions

# Test foreign key relationships
curl http://localhost:3002/api/debug/test-foreign-keys
```

## Notes
- The application is currently functional using manual joins
- Foreign key constraint issues are cosmetic (constraints exist but aren't detected)
- Manual joins provide better control and reliability
- Consider this approach for future table relationships if similar issues arise

