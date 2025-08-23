# Row Level Security (RLS) Policies

## Overview

Row Level Security (RLS) is a PostgreSQL feature that provides fine-grained access control at the row level. The RecipeNest platform implements comprehensive RLS policies to ensure data security and privacy while maintaining proper access for authenticated users.

## Policy Architecture

### RLS Enablement
All tables in the `public` schema have RLS enabled by default:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
-- ... and so on for all tables
```

### Policy Types
- **SELECT policies**: Control what data users can read
- **INSERT policies**: Control what data users can create
- **UPDATE policies**: Control what data users can modify
- **DELETE policies**: Control what data users can remove

## Core Table Policies

### Profiles Table

#### SELECT Policy: `profiles_select_policy`
**Purpose**: Control profile visibility based on user authentication and ownership

```sql
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  -- Public profiles are always visible
  auth.uid() IS NOT NULL OR
  -- Or if authenticated user is viewing their own profile
  auth.uid() = id
);
```

**Business Rules**:
- Authenticated users can view all profiles
- Unauthenticated users cannot view any profiles
- Profile information is public once authenticated

**User Types Affected**:
- ✅ **Authenticated users**: Can view all profiles
- ❌ **Unauthenticated users**: Cannot view any profiles

**Testing Scenarios**:
1. **Authenticated user viewing own profile**: Should succeed
2. **Authenticated user viewing other profile**: Should succeed
3. **Unauthenticated user viewing any profile**: Should fail
4. **Service role access**: Should bypass RLS (if needed)

#### INSERT Policy: `profiles_insert_policy`
**Purpose**: Allow users to create their own profile during signup

```sql
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
  -- Users can only create profiles for themselves
  auth.uid() = id
);
```

**Business Rules**:
- Users can only create profiles with their own user ID
- Prevents impersonation and unauthorized profile creation
- Enforced during user registration process

**User Types Affected**:
- ✅ **New users**: Can create their own profile
- ❌ **Existing users**: Cannot create profiles for others
- ❌ **Unauthenticated users**: Cannot create any profiles

**Testing Scenarios**:
1. **New user creating profile**: Should succeed
2. **User trying to create profile for another user**: Should fail
3. **Unauthenticated user creating profile**: Should fail

#### UPDATE Policy: `profiles_update_policy`
**Purpose**: Allow users to modify only their own profile

```sql
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  -- Users can only update their own profile
  auth.uid() = id
) WITH CHECK (
  -- Ensure the updated row still belongs to the user
  auth.uid() = id
);
```

**Business Rules**:
- Users can only modify their own profile information
- Prevents unauthorized profile modifications
- Maintains data integrity and privacy

**User Types Affected**:
- ✅ **Profile owners**: Can update their own profile
- ❌ **Other users**: Cannot modify profiles they don't own
- ❌ **Unauthenticated users**: Cannot modify any profiles

**Testing Scenarios**:
1. **User updating own profile**: Should succeed
2. **User trying to update another user's profile**: Should fail
3. **Unauthenticated user updating profile**: Should fail

### Recipes Table

#### SELECT Policy: `recipes_select_policy`
**Purpose**: Control recipe visibility based on public/private status and ownership

```sql
CREATE POLICY "recipes_select_policy" ON public.recipes
FOR SELECT USING (
  -- Public recipes are visible to all authenticated users
  is_public = true OR
  -- Private recipes are only visible to their authors
  auth.uid() = author_id
);
```

**Business Rules**:
- Public recipes are visible to all authenticated users
- Private recipes are only visible to their authors
- Unauthenticated users cannot view any recipes

**User Types Affected**:
- ✅ **Recipe authors**: Can view all their recipes (public and private)
- ✅ **Other authenticated users**: Can view public recipes only
- ❌ **Unauthenticated users**: Cannot view any recipes

**Testing Scenarios**:
1. **Author viewing own public recipe**: Should succeed
2. **Author viewing own private recipe**: Should succeed
3. **Other user viewing public recipe**: Should succeed
4. **Other user viewing private recipe**: Should fail
5. **Unauthenticated user viewing any recipe**: Should fail

#### INSERT Policy: `recipes_insert_policy`
**Purpose**: Allow authenticated users to create recipes

```sql
CREATE POLICY "recipes_insert_policy" ON public.recipes
FOR INSERT WITH CHECK (
  -- Only authenticated users can create recipes
  auth.uid() IS NOT NULL AND
  -- Recipe author must match the authenticated user
  auth.uid() = author_id
);
```

**Business Rules**:
- Only authenticated users can create recipes
- Users can only create recipes with themselves as the author
- Prevents unauthorized recipe creation

**User Types Affected**:
- ✅ **Authenticated users**: Can create recipes
- ❌ **Unauthenticated users**: Cannot create recipes

**Testing Scenarios**:
1. **Authenticated user creating recipe**: Should succeed
2. **User trying to create recipe for another user**: Should fail
3. **Unauthenticated user creating recipe**: Should fail

#### UPDATE Policy: `recipes_update_policy`
**Purpose**: Allow authors to modify only their own recipes

```sql
CREATE POLICY "recipes_update_policy" ON public.recipes
FOR UPDATE USING (
  -- Users can only update recipes they authored
  auth.uid() = author_id
) WITH CHECK (
  -- Ensure the updated row still belongs to the user
  auth.uid() = author_id
);
```

**Business Rules**:
- Only recipe authors can modify their recipes
- Prevents unauthorized recipe modifications
- Maintains content ownership integrity

**User Types Affected**:
- ✅ **Recipe authors**: Can update their own recipes
- ❌ **Other users**: Cannot modify recipes they didn't create
- ❌ **Unauthenticated users**: Cannot modify any recipes

**Testing Scenarios**:
1. **Author updating own recipe**: Should succeed
2. **User trying to update another user's recipe**: Should fail
3. **Unauthenticated user updating recipe**: Should fail

#### DELETE Policy: `recipes_delete_policy`
**Purpose**: Allow authors to delete only their own recipes

```sql
CREATE POLICY "recipes_delete_policy" ON public.recipes
FOR DELETE USING (
  -- Users can only delete recipes they authored
  auth.uid() = author_id
);
```

**Business Rules**:
- Only recipe authors can delete their recipes
- Prevents unauthorized recipe deletion
- Maintains content ownership control

**User Types Affected**:
- ✅ **Recipe authors**: Can delete their own recipes
- ❌ **Other users**: Cannot delete recipes they didn't create
- ❌ **Unauthenticated users**: Cannot delete any recipes

**Testing Scenarios**:
1. **Author deleting own recipe**: Should succeed
2. **User trying to delete another user's recipe**: Should fail
3. **Unauthenticated user deleting recipe**: Should fail

### Follows Table

#### SELECT Policy: `follows_select_policy`
**Purpose**: Control visibility of follow relationships

```sql
CREATE POLICY "follows_select_policy" ON public.follows
FOR SELECT USING (
  -- Users can see follows involving them (as follower or followed)
  auth.uid() = follower_id OR
  auth.uid() = followed_id
);
```

**Business Rules**:
- Users can see follows where they are the follower
- Users can see follows where they are being followed
- Prevents stalking and privacy violations
- Enables follower/following counts and lists

**User Types Affected**:
- ✅ **Followers**: Can see follows they initiated
- ✅ **Followed users**: Can see who follows them
- ❌ **Other users**: Cannot see unrelated follow relationships
- ❌ **Unauthenticated users**: Cannot see any follow relationships

**Testing Scenarios**:
1. **User viewing their own follows**: Should succeed
2. **User viewing who follows them**: Should succeed
3. **User trying to view unrelated follows**: Should fail
4. **Unauthenticated user viewing follows**: Should fail

#### INSERT Policy: `follows_insert_policy`
**Purpose**: Allow users to follow other users

```sql
CREATE POLICY "follows_insert_policy" ON public.follows
FOR INSERT WITH CHECK (
  -- Users can only follow others (not themselves)
  auth.uid() = follower_id AND
  auth.uid() != followed_id
);
```

**Business Rules**:
- Users can only create follow relationships where they are the follower
- Users cannot follow themselves
- Prevents self-following and unauthorized follow creation

**User Types Affected**:
- ✅ **Authenticated users**: Can follow other users
- ❌ **Users**: Cannot follow themselves
- ❌ **Unauthenticated users**: Cannot create follow relationships

**Testing Scenarios**:
1. **User following another user**: Should succeed
2. **User trying to follow themselves**: Should fail
3. **User trying to create follow for another user**: Should fail
4. **Unauthenticated user creating follow**: Should fail

#### DELETE Policy: `follows_delete_policy`
**Purpose**: Allow users to unfollow (remove follow relationships they initiated)

```sql
CREATE POLICY "follows_delete_policy" ON public.follows
FOR DELETE USING (
  -- Users can only unfollow relationships they initiated
  auth.uid() = follower_id
);
```

**Business Rules**:
- Users can only remove follow relationships they created
- Prevents unauthorized removal of follow relationships
- Maintains follow relationship integrity

**User Types Affected**:
- ✅ **Followers**: Can unfollow users they follow
- ❌ **Followed users**: Cannot remove follows from others
- ❌ **Unauthenticated users**: Cannot remove any follow relationships

**Testing Scenarios**:
1. **User unfollowing someone they follow**: Should succeed
2. **User trying to remove follow they didn't create**: Should fail
3. **Unauthenticated user removing follow**: Should fail

### Likes Table

#### SELECT Policy: `likes_select_policy`
**Purpose**: Control visibility of like relationships

```sql
CREATE POLICY "likes_select_policy" ON public.likes
FOR SELECT USING (
  -- Likes are public and visible to all authenticated users
  auth.uid() IS NOT NULL
);
```

**Business Rules**:
- All likes are public and visible to authenticated users
- Enables like counts and public engagement metrics
- Maintains transparency in user interactions

**User Types Affected**:
- ✅ **Authenticated users**: Can view all likes
- ❌ **Unauthenticated users**: Cannot view any likes

**Testing Scenarios**:
1. **Authenticated user viewing likes**: Should succeed
2. **Unauthenticated user viewing likes**: Should fail

#### INSERT Policy: `likes_insert_policy`
**Purpose**: Allow users to like recipes

```sql
CREATE POLICY "likes_insert_policy" ON public.likes
FOR INSERT WITH CHECK (
  -- Only authenticated users can like recipes
  auth.uid() IS NOT NULL AND
  -- User ID must match the authenticated user
  auth.uid() = user_id
);
```

**Business Rules**:
- Only authenticated users can like recipes
- Users can only create likes with themselves as the user
- Prevents unauthorized like creation

**User Types Affected**:
- ✅ **Authenticated users**: Can like recipes
- ❌ **Unauthenticated users**: Cannot like recipes

**Testing Scenarios**:
1. **Authenticated user liking recipe**: Should succeed
2. **User trying to create like for another user**: Should fail
3. **Unauthenticated user creating like**: Should fail

#### DELETE Policy: `likes_delete_policy`
**Purpose**: Allow users to unlike (remove their own likes)

```sql
CREATE POLICY "likes_delete_policy" ON public.likes
FOR DELETE USING (
  -- Users can only remove likes they created
  auth.uid() = user_id
);
```

**Business Rules**:
- Users can only remove likes they created
- Prevents unauthorized removal of likes
- Maintains like relationship integrity

**User Types Affected**:
- ✅ **Like creators**: Can remove their own likes
- ❌ **Other users**: Cannot remove likes they didn't create
- ❌ **Unauthenticated users**: Cannot remove any likes

**Testing Scenarios**:
1. **User removing their own like**: Should succeed
2. **User trying to remove another user's like**: Should fail
3. **Unauthenticated user removing like**: Should fail

### Saves Table

#### SELECT Policy: `saves_select_policy`
**Purpose**: Control visibility of save relationships (private bookmarks)

```sql
CREATE POLICY "saves_select_policy" ON public.saves
FOR SELECT USING (
  -- Users can only see their own saves
  auth.uid() = user_id
);
```

**Business Rules**:
- Saves are completely private
- Users can only see their own saved recipes
- Maintains user privacy for personal bookmarks

**User Types Affected**:
- ✅ **Save creators**: Can view their own saves
- ❌ **Other users**: Cannot view saves they didn't create
- ❌ **Unauthenticated users**: Cannot view any saves

**Testing Scenarios**:
1. **User viewing their own saves**: Should succeed
2. **User trying to view another user's saves**: Should fail
3. **Unauthenticated user viewing saves**: Should fail

#### INSERT Policy: `saves_insert_policy`
**Purpose**: Allow users to save recipes

```sql
CREATE POLICY "saves_insert_policy" ON public.saves
FOR INSERT WITH CHECK (
  -- Only authenticated users can save recipes
  auth.uid() IS NOT NULL AND
  -- User ID must match the authenticated user
  auth.uid() = user_id
);
```

**Business Rules**:
- Only authenticated users can save recipes
- Users can only create saves with themselves as the user
- Prevents unauthorized save creation

**User Types Affected**:
- ✅ **Authenticated users**: Can save recipes
- ❌ **Unauthenticated users**: Cannot save recipes

**Testing Scenarios**:
1. **Authenticated user saving recipe**: Should succeed
2. **User trying to create save for another user**: Should fail
3. **Unauthenticated user creating save**: Should fail

#### DELETE Policy: `saves_delete_policy`
**Purpose**: Allow users to remove their own saves

```sql
CREATE POLICY "saves_delete_policy" ON public.saves
FOR DELETE USING (
  -- Users can only remove saves they created
  auth.uid() = user_id
);
```

**Business Rules**:
- Users can only remove saves they created
- Prevents unauthorized removal of saves
- Maintains save relationship integrity

**User Types Affected**:
- ✅ **Save creators**: Can remove their own saves
- ❌ **Other users**: Cannot remove saves they didn't create
- ❌ **Unauthenticated users**: Cannot remove any saves

**Testing Scenarios**:
1. **User removing their own save**: Should succeed
2. **User trying to remove another user's save**: Should fail
3. **Unauthenticated user removing save**: Should fail

### Recipe Comments Table

#### SELECT Policy: `recipe_comments_select_policy`
**Purpose**: Control visibility of comments

```sql
CREATE POLICY "recipe_comments_select_policy" ON public.recipe_comments
FOR SELECT USING (
  -- Comments are public and visible to all authenticated users
  auth.uid() IS NOT NULL
);
```

**Business Rules**:
- All comments are public and visible to authenticated users
- Enables community engagement and discussion
- Maintains transparency in user interactions

**User Types Affected**:
- ✅ **Authenticated users**: Can view all comments
- ❌ **Unauthenticated users**: Cannot view any comments

**Testing Scenarios**:
1. **Authenticated user viewing comments**: Should succeed
2. **Unauthenticated user viewing comments**: Should fail

#### INSERT Policy: `recipe_comments_insert_policy`
**Purpose**: Allow users to comment on recipes

```sql
CREATE POLICY "recipe_comments_insert_policy" ON public.recipe_comments
FOR INSERT WITH CHECK (
  -- Only authenticated users can comment
  auth.uid() IS NOT NULL AND
  -- User ID must match the authenticated user
  auth.uid() = user_id
);
```

**Business Rules**:
- Only authenticated users can comment on recipes
- Users can only create comments with themselves as the user
- Prevents unauthorized comment creation

**User Types Affected**:
- ✅ **Authenticated users**: Can comment on recipes
- ❌ **Unauthenticated users**: Cannot comment on recipes

**Testing Scenarios**:
1. **Authenticated user commenting on recipe**: Should succeed
2. **User trying to create comment for another user**: Should fail
3. **Unauthenticated user creating comment**: Should fail

#### UPDATE Policy: `recipe_comments_update_policy`
**Purpose**: Allow users to edit their own comments

```sql
CREATE POLICY "recipe_comments_update_policy" ON public.recipe_comments
FOR UPDATE USING (
  -- Users can only edit comments they created
  auth.uid() = user_id
) WITH CHECK (
  -- Ensure the updated row still belongs to the user
  auth.uid() = user_id
);
```

**Business Rules**:
- Users can only edit comments they created
- Prevents unauthorized comment modifications
- Maintains comment ownership integrity

**User Types Affected**:
- ✅ **Comment authors**: Can edit their own comments
- ❌ **Other users**: Cannot edit comments they didn't create
- ❌ **Unauthenticated users**: Cannot edit any comments

**Testing Scenarios**:
1. **User editing their own comment**: Should succeed
2. **User trying to edit another user's comment**: Should fail
3. **Unauthenticated user editing comment**: Should fail

#### DELETE Policy: `recipe_comments_delete_policy`
**Purpose**: Allow users to delete their own comments

```sql
CREATE POLICY "recipe_comments_delete_policy" ON public.recipe_comments
FOR DELETE USING (
  -- Users can only delete comments they created
  auth.uid() = user_id
);
```

**Business Rules**:
- Users can only delete comments they created
- Prevents unauthorized comment deletion
- Maintains comment ownership control

**User Types Affected**:
- ✅ **Comment authors**: Can delete their own comments
- ❌ **Other users**: Cannot delete comments they didn't create
- ❌ **Unauthenticated users**: Cannot delete any comments

**Testing Scenarios**:
1. **User deleting their own comment**: Should succeed
2. **User trying to delete another user's comment**: Should fail
3. **Unauthenticated user deleting comment**: Should fail

## Policy Dependencies

### Authentication Dependencies
- All policies depend on `auth.uid()` function
- Policies fail gracefully when user is not authenticated
- Service role access may bypass RLS for administrative operations

### Data Integrity Dependencies
- Foreign key constraints work in conjunction with RLS policies
- Cascade deletes respect RLS policies
- Triggers execute within the context of RLS policies

### Business Logic Dependencies
- Follow policies prevent self-following
- Like/Save policies prevent duplicate relationships
- Comment policies maintain ownership integrity

## Testing & Validation

### Policy Testing Scenarios
Each policy should be tested with:
1. **Authenticated user with ownership**: Should succeed
2. **Authenticated user without ownership**: Should fail
3. **Unauthenticated user**: Should fail
4. **Service role access**: Should bypass RLS (if needed)

### Integration Testing
- Test policies work with foreign key constraints
- Verify cascade deletes respect RLS policies
- Ensure triggers execute correctly within policy context

### Performance Testing
- Monitor policy execution performance
- Verify indexes support policy queries efficiently
- Test with large datasets to ensure scalability

## Security Considerations

### Policy Bypass Prevention
- Service role access should be limited and audited
- Application-level validation provides additional security layer
- Regular policy review and testing prevents security gaps

### Data Privacy
- Private content (saves, private recipes) properly protected
- Social features maintain appropriate visibility levels
- User consent and control over personal data

### Audit & Monitoring
- Log all policy violations for security monitoring
- Track policy changes and their impact
- Regular security assessments and penetration testing

## Future Enhancements

### Planned Policy Improvements
- **Content moderation**: Policies for flagged content
- **Role-based access**: Different access levels for moderators
- **Temporary access**: Time-limited access for specific operations
- **Geographic restrictions**: Location-based access control

### Advanced Security Features
- **Row encryption**: Sensitive data encryption at rest
- **Audit trails**: Comprehensive change tracking
- **Policy versioning**: Track policy changes over time
- **Automated testing**: CI/CD integration for policy validation
