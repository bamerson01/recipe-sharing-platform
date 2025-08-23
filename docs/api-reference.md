# API Reference

## Overview

The RecipeNest platform provides a comprehensive API for recipe management, user interactions, and social features. This document covers all available endpoints, server actions, and data schemas used throughout the application.

## Recent Updates (2025-01-23)

### New Service Layer
- Added centralized `RecipeService` class in `/src/lib/services/recipe-service.ts`
- Consolidated duplicate recipe fetching logic
- Improved type safety with proper TypeScript interfaces

### Security Improvements
- Added authentication to debug endpoints
- Removed console.log statements from production code
- Protected additional routes in middleware

### Performance Optimizations
- Fixed N+1 query in dashboard stats
- Optimized recipe fetching with batch queries
- Improved database query efficiency

## Server Actions

### Authentication Actions

#### `signIn(email: string, password: string)`
**Purpose**: Authenticate user with email and password

**Parameters**:
- `email` (string): User's email address
- `password` (string): User's password

**Returns**:
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

**Usage**:
```typescript
const result = await signIn('user@example.com', 'password123');
if (result.success) {
  // User authenticated successfully
  redirect('/dashboard');
} else {
  // Handle authentication error
  setError(result.error);
}
```

#### `signUp(email: string, password: string, username: string)`
**Purpose**: Create new user account

**Parameters**:
- `email` (string): User's email address
- `password` (string): User's password (minimum 8 characters)
- `username` (string): Unique username for the platform

**Returns**:
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

**Usage**:
```typescript
const result = await signUp('newuser@example.com', 'password123', 'newuser');
if (result.success) {
  // Account created successfully
  redirect('/onboarding');
} else {
  // Handle creation error
  setError(result.error);
}
```

#### `signOut()`
**Purpose**: Sign out current user

**Parameters**: None

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Usage**:
```typescript
const result = await signOut();
if (result.success) {
  // User signed out successfully
  redirect('/');
} else {
  // Handle sign out error
  console.error(result.error);
}
```

### Recipe Actions

#### `createRecipe(formData: FormData)`
**Purpose**: Create a new recipe

**Parameters**:
- `formData` (FormData): Recipe data including title, summary, ingredients, steps, etc.

**Returns**:
```typescript
{
  success: boolean;
  recipe?: Recipe;
  error?: string | ValidationError[];
}
```

**Form Data Fields**:
- `title` (string): Recipe title (required)
- `summary` (string): Recipe description
- `difficulty` (string): Easy, Medium, or Hard
- `prep_time` (number): Preparation time in minutes
- `cook_time` (number): Cooking time in minutes
- `ingredients` (string): JSON array of ingredient objects
- `steps` (string): JSON array of step objects
- `categories` (string): JSON array of category IDs
- `is_public` (boolean): Recipe visibility setting
- `cover_image` (File): Recipe cover image (optional)

**Usage**:
```typescript
const formData = new FormData();
formData.append('title', 'Chocolate Chip Cookies');
formData.append('summary', 'Classic homemade cookies');
formData.append('difficulty', 'Easy');
formData.append('prep_time', '15');
formData.append('cook_time', '12');
formData.append('ingredients', JSON.stringify([
  { text: '2 cups all-purpose flour' },
  { text: '1 cup chocolate chips' }
]));
formData.append('steps', JSON.stringify([
  { text: 'Preheat oven to 350°F' },
  { text: 'Mix ingredients together' }
]));
formData.append('is_public', 'true');

const result = await createRecipe(formData);
if (result.success) {
  // Recipe created successfully
  redirect(`/r/${result.recipe.slug}`);
} else {
  // Handle creation error
  setErrors(result.error);
}
```

#### `updateRecipe(recipeId: number, formData: FormData)`
**Purpose**: Update an existing recipe

**Parameters**:
- `recipeId` (number): ID of the recipe to update
- `formData` (FormData): Updated recipe data

**Returns**:
```typescript
{
  success: boolean;
  recipe?: Recipe;
  error?: string | ValidationError[];
}
```

**Usage**:
```typescript
const formData = new FormData();
formData.append('title', 'Updated Recipe Title');
formData.append('summary', 'Updated description');

const result = await updateRecipe(123, formData);
if (result.success) {
  // Recipe updated successfully
  toast.success('Recipe updated!');
} else {
  // Handle update error
  setErrors(result.error);
}
```

#### `deleteRecipe(recipeId: number)`
**Purpose**: Delete a recipe

**Parameters**:
- `recipeId` (number): ID of the recipe to delete

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Usage**:
```typescript
const result = await deleteRecipe(123);
if (result.success) {
  // Recipe deleted successfully
  redirect('/my-recipes');
} else {
  // Handle deletion error
  toast.error(result.error);
}
```

#### `toggleLike(recipeId: number)`
**Purpose**: Like or unlike a recipe

**Parameters**:
- `recipeId` (number): ID of the recipe to like/unlike

**Returns**:
```typescript
{
  success: boolean;
  isLiked: boolean;
  likeCount: number;
  error?: string;
}
```

**Usage**:
```typescript
const result = await toggleLike(123);
if (result.success) {
  // Update UI with new like state
  setIsLiked(result.isLiked);
  setLikeCount(result.likeCount);
} else {
  // Handle error
  toast.error(result.error);
}
```

#### `toggleSave(recipeId: number)`
**Purpose**: Save or unsave a recipe

**Parameters**:
- `recipeId` (number): ID of the recipe to save/unsave

**Returns**:
```typescript
{
  success: boolean;
  isSaved: boolean;
  error?: string;
}
```

**Usage**:
```typescript
const result = await toggleSave(123);
if (result.success) {
  // Update UI with new save state
  setIsSaved(result.isSaved);
  toast.success(result.isSaved ? 'Recipe saved!' : 'Recipe removed from saves');
} else {
  // Handle error
  toast.error(result.error);
}
```

### Social Actions

#### `followUser(userIdToFollow: string)`
**Purpose**: Follow another user

**Parameters**:
- `userIdToFollow` (string): UUID of the user to follow

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Usage**:
```typescript
const result = await followUser('user-uuid-here');
if (result.success) {
  // User followed successfully
  setIsFollowing(true);
  toast.success('User followed!');
} else {
  // Handle error
  toast.error(result.error);
}
```

#### `unfollowUser(userIdToUnfollow: string)`
**Purpose**: Unfollow a user

**Parameters**:
- `userIdToUnfollow` (string): UUID of the user to unfollow

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Usage**:
```typescript
const result = await unfollowUser('user-uuid-here');
if (result.success) {
  // User unfollowed successfully
  setIsFollowing(false);
  toast.success('User unfollowed');
} else {
  // Handle error
  toast.error(result.error);
}
```

#### `createComment(recipeId: number, body: string, parentId?: string)`
**Purpose**: Create a comment on a recipe

**Parameters**:
- `recipeId` (number): ID of the recipe to comment on
- `body` (string): Comment text content
- `parentId` (string, optional): Parent comment ID for replies

**Returns**:
```typescript
{
  success: boolean;
  comment?: Comment;
  error?: string;
}
```

**Usage**:
```typescript
const result = await createComment(123, 'Great recipe! I loved it.');
if (result.success) {
  // Comment created successfully
  setComments(prev => [result.comment, ...prev]);
  setCommentText('');
} else {
  // Handle error
  toast.error(result.error);
}
```

### Profile Actions

#### `updateProfile(formData: FormData)`
**Purpose**: Update user profile information

**Parameters**:
- `formData` (FormData): Profile data including display name, bio, avatar

**Returns**:
```typescript
{
  success: boolean;
  profile?: Profile;
  error?: string | ValidationError[];
}
```

**Form Data Fields**:
- `display_name` (string): User's display name
- `bio` (string): User biography
- `avatar` (File): Profile picture (optional)

**Usage**:
```typescript
const formData = new FormData();
formData.append('display_name', 'John Doe');
formData.append('bio', 'Passionate home cook');

const result = await updateProfile(formData);
if (result.success) {
  // Profile updated successfully
  toast.success('Profile updated!');
} else {
  // Handle error
  setErrors(result.error);
}
```

#### `uploadAvatar(file: File)`
**Purpose**: Upload profile avatar image

**Parameters**:
- `file` (File): Image file to upload

**Returns**:
```typescript
{
  success: boolean;
  avatarUrl?: string;
  error?: string;
}
```

**Usage**:
```typescript
const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const result = await uploadAvatar(file);
  if (result.success) {
    // Avatar uploaded successfully
    setAvatarUrl(result.avatarUrl);
    toast.success('Avatar updated!');
  } else {
    // Handle error
    toast.error(result.error);
  }
}
```

## Route Handlers

### Public APIs

#### `GET /api/recipes`
**Purpose**: Fetch public recipes with filtering and pagination

**Query Parameters**:
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of recipes per page (default: 20)
- `search` (string): Search query for recipe content
- `category` (string): Category filter
- `sort` (string): Sort order (newest, popular, alphabetical)
- `difficulty` (string): Difficulty filter (easy, medium, hard)

**Response**:
```typescript
{
  recipes: Recipe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

**Usage**:
```typescript
const response = await fetch('/api/recipes?page=1&limit=10&search=cookies');
const data = await response.json();
setRecipes(data.recipes);
setPagination(data.pagination);
```

#### `GET /api/recipes/[id]`
**Purpose**: Fetch a specific recipe by ID

**Path Parameters**:
- `id` (number): Recipe ID

**Response**:
```typescript
{
  recipe: Recipe;
  author: Profile;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  categories: Category[];
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  commentCount: number;
}
```

**Usage**:
```typescript
const response = await fetch(`/api/recipes/${recipeId}`);
const data = await response.json();
setRecipe(data.recipe);
setAuthor(data.author);
setIngredients(data.ingredients);
```

#### `GET /api/categories`
**Purpose**: Fetch all available recipe categories

**Response**:
```typescript
{
  categories: Category[];
}
```

**Usage**:
```typescript
const response = await fetch('/api/categories');
const data = await response.json();
setCategories(data.categories);
```

#### `GET /api/users/[username]`
**Purpose**: Fetch public user profile by username

**Path Parameters**:
- `username` (string): User's username

**Response**:
```typescript
{
  profile: Profile;
  recipes: Recipe[];
  stats: {
    recipeCount: number;
    followerCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
}
```

**Usage**:
```typescript
const response = await fetch(`/api/users/${username}`);
const data = await response.json();
setProfile(data.profile);
setUserRecipes(data.recipes);
setUserStats(data.stats);
```

### Protected APIs

#### `GET /api/dashboard`
**Purpose**: Fetch user dashboard data

**Authentication**: Required

**Response**:
```typescript
{
  stats: {
    recipeCount: number;
    savedCount: number;
    likeCount: number;
    commentCount: number;
    followerCount: number;
    followingCount: number;
  };
  recentRecipes: Recipe[];
  fromFollowing: Recipe[];
  recentActivity: Activity[];
}
```

**Usage**:
```typescript
const response = await fetch('/api/dashboard', {
  credentials: 'include'
});
const data = await response.json();
setDashboardStats(data.stats);
setRecentRecipes(data.recentRecipes);
```

#### `GET /api/saved-recipes`
**Purpose**: Fetch user's saved recipes

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of recipes per page
- `search` (string): Search query
- `category` (string): Category filter

**Response**:
```typescript
{
  recipes: Recipe[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/saved-recipes?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setSavedRecipes(data.recipes);
```

#### `GET /api/my-recipes`
**Purpose**: Fetch user's own recipes

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of recipes per page
- `search` (string): Search query
- `status` (string): Recipe status filter (public, private, draft)

**Response**:
```typescript
{
  recipes: Recipe[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/my-recipes?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setMyRecipes(data.recipes);
```

#### `GET /api/interactions/likes`
**Purpose**: Fetch users who liked the current user's recipes

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response**:
```typescript
{
  likes: LikeInteraction[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/interactions/likes?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setLikesInteractions(data.likes);
```

#### `GET /api/interactions/comments`
**Purpose**: Fetch comments on the current user's recipes

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response**:
```typescript
{
  comments: CommentInteraction[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/interactions/comments?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setCommentsInteractions(data.comments);
```

#### `GET /api/connections/followers`
**Purpose**: Fetch users following the current user

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response**:
```typescript
{
  followers: Follower[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/connections/followers?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setFollowers(data.followers);
```

#### `GET /api/connections/following`
**Purpose**: Fetch users the current user is following

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response**:
```typescript
{
  following: Following[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/connections/following?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setFollowing(data.following);
```

### Search & Discovery APIs

#### `GET /api/search`
**Purpose**: Full-text search across recipes

**Query Parameters**:
- `q` (string): Search query
- `page` (number): Page number for pagination
- `limit` (number): Number of results per page
- `category` (string): Category filter
- `difficulty` (string): Difficulty filter
- `sort` (string): Sort order (relevance, newest, popular)

**Response**:
```typescript
{
  results: Recipe[];
  pagination: PaginationInfo;
  searchStats: {
    totalResults: number;
    searchTime: number;
    query: string;
  };
}
```

**Usage**:
```typescript
const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=1&limit=20`);
const data = await response.json();
setSearchResults(data.results);
setSearchStats(data.searchStats);
```

#### `GET /api/feed/popular`
**Purpose**: Fetch popular recipes based on like counts

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of recipes per page
- `timeframe` (string): Time period (day, week, month, all)

**Response**:
```typescript
{
  recipes: Recipe[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/feed/popular?timeframe=week&page=1&limit=10');
const data = await response.json();
setPopularRecipes(data.recipes);
```

#### `GET /api/feed/recent`
**Purpose**: Fetch recently created recipes

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of recipes per page

**Response**:
```typescript
{
  recipes: Recipe[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/feed/recent?page=1&limit=10');
const data = await response.json();
setRecentRecipes(data.recipes);
```

#### `GET /api/feed/following`
**Purpose**: Fetch recipes from users the current user follows

**Authentication**: Required

**Query Parameters**:
- `page` (number): Page number for pagination
- `limit` (number): Number of recipes per page

**Response**:
```typescript
{
  recipes: Recipe[];
  pagination: PaginationInfo;
}
```

**Usage**:
```typescript
const response = await fetch('/api/feed/following?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
setFollowingRecipes(data.recipes);
```

## Request/Response Schemas

### Core Data Types

#### Recipe
```typescript
interface Recipe {
  id: number;
  title: string;
  slug: string;
  summary: string;
  cover_image_key: string | null;
  is_public: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prep_time: number;
  cook_time: number;
  like_count: number;
  author_id: string;
  created_at: string;
  updated_at: string;
  search_vector?: string;
}
```

#### Profile
```typescript
interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}
```

#### RecipeIngredient
```typescript
interface RecipeIngredient {
  id: number;
  recipe_id: number;
  position: number;
  text: string;
  created_at: string;
}
```

#### RecipeStep
```typescript
interface RecipeStep {
  id: number;
  recipe_id: number;
  position: number;
  text: string;
  created_at: string;
}
```

#### Category
```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}
```

#### Like
```typescript
interface Like {
  id: number;
  recipe_id: number;
  user_id: string;
  created_at: string;
}
```

#### Save
```typescript
interface Save {
  id: number;
  recipe_id: number;
  user_id: string;
  created_at: string;
}
```

#### Follow
```typescript
interface Follow {
  id: number;
  follower_id: string;
  followed_id: string;
  created_at: string;
}
```

#### Comment
```typescript
interface Comment {
  id: string;
  recipe_id: number;
  user_id: string;
  body: string;
  parent_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  like_count: number;
  created_at: string;
}
```

### Extended Data Types

#### RecipeWithDetails
```typescript
interface RecipeWithDetails extends Recipe {
  author: Profile;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  categories: Category[];
  isLiked: boolean;
  isSaved: boolean;
  commentCount: number;
}
```

#### LikeInteraction
```typescript
interface LikeInteraction {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  recipe_id: number;
  recipe_title: string;
  recipe_slug: string;
  liked_at: string;
}
```

#### CommentInteraction
```typescript
interface CommentInteraction {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  recipe_id: number;
  recipe_title: string;
  recipe_slug: string;
  comment_body: string;
  commented_at: string;
}
```

#### Follower
```typescript
interface Follower {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  followed_at: string;
}
```

#### Following
```typescript
interface Following {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  followed_at: string;
}
```

### Pagination Types

#### PaginationInfo
```typescript
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

#### SearchStats
```typescript
interface SearchStats {
  totalResults: number;
  searchTime: number;
  query: string;
}
```

### Error Types

#### ValidationError
```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
}
```

#### APIError
```typescript
interface APIError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}
```

## Authentication & Authorization

### JWT Token Management
- **Token Storage**: HTTP-only cookies for security
- **Token Refresh**: Automatic refresh via Supabase client
- **Session Management**: Server-side session validation
- **Logout**: Proper token invalidation and cleanup

### Row Level Security (RLS)
- **Public Access**: Unauthenticated users can view public content
- **Authenticated Access**: Logged-in users can access additional features
- **Owner Access**: Users have full access to their own content
- **Service Role**: Limited administrative access for specific operations

### Rate Limiting
- **API Limits**: 100 requests per minute per IP
- **Upload Limits**: 10MB per file upload
- **Search Limits**: 1000 results per search query
- **Pagination**: Maximum 100 items per page

## Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Error Response Format
```typescript
{
  error: string;
  message: string;
  statusCode: number;
  details?: ValidationError[] | any;
  timestamp: string;
  requestId: string;
}
```

### Common Error Scenarios
- **Validation Errors**: Form data validation failures
- **Authentication Errors**: Invalid or expired tokens
- **Authorization Errors**: Insufficient permissions
- **Rate Limit Errors**: Too many requests
- **Database Errors**: Database connection or query failures

## Performance Considerations

### Caching Strategy
- **Next.js Cache**: Automatic caching of server component data
- **Route Cache**: Caching of API route responses
- **Image Cache**: CDN caching for static assets
- **Database Cache**: Query result caching where appropriate

### Optimization Techniques
- **Pagination**: Efficient data loading for large datasets
- **Selective Fields**: Only fetch required data
- **Batch Queries**: Combine multiple queries where possible
- **Lazy Loading**: Load non-critical data on demand

### Monitoring & Metrics
- **Response Times**: Track API endpoint performance
- **Error Rates**: Monitor API error frequencies
- **Usage Patterns**: Analyze API usage statistics
- **Performance Alerts**: Automated performance monitoring

## Development & Testing

### Local Development
- **Environment Setup**: Local Supabase instance
- **API Testing**: Postman or similar tools
- **Error Logging**: Comprehensive local error tracking
- **Performance Testing**: Load testing for critical endpoints

### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoint functionality
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test API response times and throughput

### Documentation Updates
- **API Changes**: Update documentation for all API modifications
- **Schema Changes**: Document new data types and structures
- **Example Updates**: Keep code examples current
- **Migration Guides**: Provide clear upgrade instructions
