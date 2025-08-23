# Social Features Fix Documentation

## Date: August 23, 2025

## Overview
This document details the comprehensive fixes applied to resolve social features issues in the RecipeNest application, including follow/unfollow functionality, follower/following lists, and the addition of follow buttons to recipe cards and modals.

## Issues Identified and Resolved

### 1. Database Column Name Mismatch
**Problem**: The application code was using `following_id` but the actual database column was `followed_id`.

**Root Causes**:
- Historical schema change where the column was renamed in the database
- TypeScript types were not updated to match
- Database trigger function still referenced old column name

**Solutions Applied**:

#### A. Application Code Updates
All references to `following_id` were changed to `followed_id` in the following files:

- `/src/app/_actions/manage-follows.ts`
  - Updated all server actions (followUser, unfollowUser, getFollowers, getFollowing, getRecentFromFollowing)
  - Fixed column references in all Supabase queries

- `/src/app/api/users/[username]/follow/route.ts`
  - Fixed POST endpoint for following users
  - Fixed DELETE endpoint for unfollowing users
  - Fixed GET endpoint for checking follow status

- `/src/app/api/users/[username]/followers/route.ts`
  - Updated query to use `followed_id`
  - Fixed profile data fetching

- `/src/app/api/users/[username]/following/route.ts`
  - Updated query to use `followed_id`
  - Fixed foreign key references

- `/src/app/api/feed/following/route.ts`
  - Fixed query to fetch recipes from followed users

#### B. TypeScript Type Definitions
Updated `/src/types/database.ts`:
```typescript
// Before
follows: {
  Row: {
    following_id: string;
    // ...
  }
}

// After
follows: {
  Row: {
    followed_id: string;
    // ...
  }
}
```

#### C. Database Trigger Fix
Fixed the `update_follow_counts` function in the database:
```sql
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Changed from NEW.following_id to NEW.followed_id
        UPDATE public.profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.followed_id;
        
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Changed from OLD.following_id to OLD.followed_id
        UPDATE public.profiles 
        SET follower_count = GREATEST(0, follower_count - 1)
        WHERE id = OLD.followed_id;
        
        UPDATE public.profiles 
        SET following_count = GREATEST(0, following_count - 1)
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 2. Foreign Key Relationship Issues
**Problem**: Supabase couldn't find foreign key relationships for joins like `profiles!follows_following_id_fkey`.

**Solution**: Removed explicit foreign key syntax and fetch related data separately:

```typescript
// Before - Using foreign key syntax (not working)
const { data: followers } = await supabase
  .from('follows')
  .select(`
    follower:profiles!follows_follower_id_fkey(
      id, username, display_name
    )
  `);

// After - Fetching data separately
const { data: followers } = await supabase
  .from('follows')
  .select('id, created_at, follower_id');

const followerIds = followers.map(f => f.follower_id);
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username, display_name, avatar_key, bio')
  .in('id', followerIds);
```

### 3. Webpack Compilation Error
**Problem**: Home page showed webpack error "Cannot read properties of undefined (reading 'call')".

**Solution**: Cleared Next.js cache:
```bash
rm -rf .next && npm run dev
```

## New Features Added

### Follow/Unfollow Buttons on Recipe Cards
**Location**: `/src/components/recipe-card-unified.tsx`

**Implementation**:
- Added `FollowButton` import
- Integrated follow button next to author name
- Used `variant="ghost"` and `size="sm"` for subtle appearance
- Added click event propagation prevention

**Code Added**:
```tsx
{recipe.author.username && (
  <div onClick={(e) => e.stopPropagation()}>
    <FollowButton
      username={recipe.author.username}
      userId={recipe.author.id}
      variant="ghost"
      size="sm"
      showText={false}
    />
  </div>
)}
```

### Follow/Unfollow Buttons on Recipe Modals
**Location**: `/src/components/recipe-detail-modal-unified.tsx`

**Implementation**:
- Added `FollowButton` import
- Integrated follow button in author section
- Only displays for non-owner recipes
- Consistent styling with card implementation

**Code Added**:
```tsx
{recipe.author.username && (
  <FollowButton
    username={recipe.author.username}
    userId={recipe.author.id}
    variant="ghost"
    size="sm"
    showText={false}
  />
)}
```

## Debug Endpoints Created (Development Only)

Several debug endpoints were created during troubleshooting:

1. `/api/debug/social-debug` - Test all social functions
2. `/api/debug/verify-counts` - Verify follower/following counts
3. `/api/debug/test-social` - Test social features with authentication
4. `/api/debug/check-tables` - Check which follows table has data
5. `/api/debug/check-column` - Verify correct column names
6. `/api/debug/test-joins` - Test foreign key joins

**Note**: These can be removed in production or kept for debugging purposes.

## Files Modified Summary

### Core Application Files
1. `/src/app/_actions/manage-follows.ts` - Server actions for follow management
2. `/src/app/api/users/[username]/follow/route.ts` - Follow/unfollow API endpoint
3. `/src/app/api/users/[username]/followers/route.ts` - Followers list endpoint
4. `/src/app/api/users/[username]/following/route.ts` - Following list endpoint
5. `/src/app/api/feed/following/route.ts` - Feed from followed users
6. `/src/types/database.ts` - TypeScript type definitions
7. `/src/components/recipe-card-unified.tsx` - Recipe card component
8. `/src/components/recipe-detail-modal-unified.tsx` - Recipe modal component
9. `/src/components/follow-button.tsx` - Follow button component (cleaned up logging)

### Database Files
1. `/database/fix_update_follow_counts.sql` - SQL to fix the trigger function

## Testing Performed

1. ✅ Follow/unfollow buttons work on user profiles
2. ✅ Follow/unfollow buttons work on recipe cards
3. ✅ Follow/unfollow buttons work on recipe modals
4. ✅ Follower counts update correctly
5. ✅ Following counts update correctly
6. ✅ "From People You Follow" section loads recipes
7. ✅ Followers page displays correct users
8. ✅ Following page displays correct users
9. ✅ No self-following is possible
10. ✅ Toast notifications appear for success/error

## Performance Improvements

1. Removed unnecessary console.log statements
2. Added development-only error logging
3. Optimized database queries by fetching related data in batches
4. Added proper error handling with user-friendly messages

## Security Considerations

1. Error details only shown in development environment
2. Proper authentication checks in all endpoints
3. Prevention of self-following
4. SQL injection prevention through parameterized queries

## Future Recommendations

1. Consider adding database indexes on `follower_id` and `followed_id` columns for better query performance
2. Implement caching for follow status to reduce database queries
3. Add real-time updates using Supabase subscriptions
4. Consider adding bulk follow/unfollow functionality for better UX

## Migration Notes

If deploying to production, ensure:
1. Run the database trigger fix SQL in production
2. Clear any cached data that might reference old column names
3. Test thoroughly after deployment
4. Monitor error logs for any missed references to `following_id`

## Rollback Plan

If issues arise:
1. The changes are backward-compatible as long as the database trigger is updated
2. Keep the old column name references commented out for quick rollback if needed
3. Database trigger can be reverted independently of application code

## Conclusion

All social features are now fully functional with improved user experience through the addition of follow buttons directly on recipe cards and modals. The root cause (database column name mismatch at multiple layers) has been completely resolved.