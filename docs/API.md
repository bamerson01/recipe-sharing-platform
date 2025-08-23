# API Documentation

## Overview
RecipeNest API is built with Next.js App Router API routes. All endpoints return JSON and use standard HTTP status codes.

## Authentication
Authentication is handled via Supabase Auth. Protected endpoints require a valid session cookie.

```typescript
// Check authentication in API routes
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

---

## Endpoints

### Authentication

#### GET /api/auth/session
Get current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### User Profile

#### GET /api/profile
Get current user's profile.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "username": "johndoe",
    "display_name": "John Doe",
    "bio": "Food enthusiast",
    "avatar_key": "avatars/uuid/image.jpg",
    "follower_count": 10,
    "following_count": 5,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/profile
Update current user's profile.

**Request Body:**
```json
{
  "display_name": "John Doe",
  "username": "johndoe",
  "bio": "Updated bio"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### POST /api/profile/avatar
Upload profile avatar.

**Request:** Multipart form data with `avatar` file field

**Response:**
```json
{
  "success": true,
  "avatar_key": "avatars/uuid/image.jpg"
}
```

---

### User Operations

#### GET /api/users/[username]/follow
Check if current user follows target user.

**Response:**
```json
{
  "isFollowing": true,
  "followId": "uuid"
}
```

#### POST /api/users/[username]/follow
Follow a user.

**Response:**
```json
{
  "success": true,
  "message": "You are now following John Doe"
}
```

#### DELETE /api/users/[username]/follow
Unfollow a user.

**Response:**
```json
{
  "success": true,
  "message": "You have unfollowed John Doe"
}
```

#### GET /api/users/[username]/followers
Get user's followers.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "followers": [
    {
      "id": "uuid",
      "username": "follower1",
      "display_name": "Follower One",
      "avatar_key": "path/to/avatar.jpg"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

#### GET /api/users/[username]/following
Get users that target user follows.

**Response:** Same structure as followers endpoint

#### GET /api/users/stats
Get current user's statistics.

**Response:**
```json
{
  "recipes": 10,
  "saved": 25,
  "likes": 100,
  "followers": 50,
  "following": 30
}
```

---

### Recipes

#### GET /api/recipes/[id]
Get recipe by ID.

**Response:**
```json
{
  "recipe": {
    "id": 1,
    "title": "Pasta Carbonara",
    "slug": "pasta-carbonara",
    "summary": "Classic Italian pasta",
    "cover_image_key": "recipes/1/cover.jpg",
    "difficulty": "medium",
    "prep_time": 15,
    "cook_time": 20,
    "ingredients": [
      { "id": 1, "text": "400g spaghetti", "position": 1 }
    ],
    "steps": [
      { "id": 1, "text": "Boil water", "position": 1 }
    ],
    "categories": [
      { "id": 1, "name": "Italian", "slug": "italian" }
    ],
    "author": {
      "id": "uuid",
      "username": "chef",
      "display_name": "Chef John"
    },
    "like_count": 42,
    "save_count": 15,
    "comment_count": 8,
    "is_liked": false,
    "is_saved": false
  }
}
```

#### POST /api/recipes
Create new recipe.

**Request Body:**
```json
{
  "title": "Recipe Title",
  "summary": "Brief description",
  "ingredients": ["Ingredient 1", "Ingredient 2"],
  "steps": ["Step 1", "Step 2"],
  "categories": [1, 2],
  "difficulty": "easy",
  "prep_time": 10,
  "cook_time": 20,
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "recipe": { /* recipe object */ }
}
```

#### PUT /api/recipes/[id]
Update recipe (author only).

**Request Body:** Same as POST

**Response:**
```json
{
  "success": true,
  "message": "Recipe updated successfully"
}
```

#### DELETE /api/recipes/[id]
Delete recipe (author only).

**Response:**
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

#### PATCH /api/recipes/[id]/visibility
Toggle recipe visibility (author only).

**Request Body:**
```json
{
  "is_public": false
}
```

#### GET /api/recipes/my
Get current user's recipes.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "recipes": [ /* array of recipes */ ],
  "total": 10
}
```

#### GET /api/recipes/saved
Get user's saved recipes.

**Response:**
```json
{
  "recipes": [ /* array of recipes */ ],
  "total": 25
}
```

---

### Recipe Interactions

#### POST /api/recipes/[id]/like
Like a recipe.

**Response:**
```json
{
  "success": true,
  "liked": true,
  "likeCount": 43
}
```

#### DELETE /api/recipes/[id]/like
Unlike a recipe.

**Response:**
```json
{
  "success": true,
  "liked": false,
  "likeCount": 42
}
```

#### POST /api/recipes/[id]/save
Save recipe to cookbook.

**Response:**
```json
{
  "success": true,
  "saved": true
}
```

#### DELETE /api/recipes/[id]/save
Remove from cookbook.

**Response:**
```json
{
  "success": true,
  "saved": false
}
```

#### GET /api/recipes/[id]/comments
Get recipe comments.

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "body": "Great recipe!",
      "user": {
        "username": "user1",
        "display_name": "User One",
        "avatar_key": "path/to/avatar.jpg"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/recipes/[id]/comments
Add comment to recipe.

**Request Body:**
```json
{
  "body": "This looks delicious!"
}
```

---

### Search & Discovery

#### GET /api/search
Search recipes.

**Query Parameters:**
- `q`: Search query
- `categories`: Comma-separated category IDs
- `sort`: 'relevance' | 'newest' | 'top'
- `page`: Page number
- `limit`: Results per page (max: 100)

**Response:**
```json
{
  "recipes": [ /* array of recipes */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**Performance Note:** This endpoint uses batch fetching to avoid N+1 queries.

#### GET /api/feed/popular
Get popular recipes.

**Query Parameters:**
- `limit`: Number of recipes (default: 20)

#### GET /api/feed/recent  
Get recent recipes.

**Query Parameters:**
- `limit`: Number of recipes (default: 20)

#### GET /api/feed/following
Get recipes from followed users.

**Response:**
```json
{
  "recipes": [ /* recipes from followed users */ ]
}
```

#### GET /api/categories
Get all recipe categories.

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Italian",
      "slug": "italian"
    }
  ]
}
```

#### GET /api/creators
Get creator profiles.

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page

**Response:**
```json
{
  "creators": [
    {
      "id": "uuid",
      "username": "chef1",
      "display_name": "Chef One",
      "avatar_key": "path/to/avatar.jpg",
      "bio": "Professional chef",
      "recipe_count": 25,
      "follower_count": 100,
      "is_following": false
    }
  ],
  "total": 50
}
```

---

### Storage

#### POST /api/upload/recipe-image
Upload recipe image.

**Request:** Multipart form data with `image` file field

**Response:**
```json
{
  "success": true,
  "image_key": "recipes/1/image.jpg",
  "url": "https://storage.url/recipes/1/image.jpg"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Auth endpoints**: 5 requests/minute
- **Write operations**: 30 requests/minute  
- **Read operations**: 100 requests/minute
- **File uploads**: 10 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

When rate limited:
```json
{
  "error": "Too many requests",
  "retryAfter": 45
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Optional additional context"
}
```

### Common Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limited
- `500 Internal Server Error`: Server error

---

## Pagination

Paginated endpoints accept:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

## Best Practices

### Request Headers
```
Content-Type: application/json
Accept: application/json
```

### File Uploads
- Max file size: 5MB
- Accepted formats: jpg, jpeg, png, webp
- Images are automatically optimized

### Performance Tips
1. Use pagination for large datasets
2. Include only needed fields in requests
3. Cache responses where appropriate
4. Batch related requests when possible

### Security
1. Never expose sensitive data in responses
2. Validate all input data
3. Use parameterized queries
4. Implement proper CORS headers
5. Rate limit all endpoints

---

## Examples

### Create a Recipe (Full Flow)
```javascript
// 1. Upload cover image
const formData = new FormData();
formData.append('image', imageFile);
const imageRes = await fetch('/api/upload/recipe-image', {
  method: 'POST',
  body: formData
});
const { image_key } = await imageRes.json();

// 2. Create recipe
const recipeRes = await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Recipe',
    summary: 'Delicious recipe',
    cover_image_key: image_key,
    ingredients: ['Ingredient 1'],
    steps: ['Step 1'],
    categories: [1],
    difficulty: 'easy',
    prep_time: 10,
    cook_time: 20
  })
});
const { recipe } = await recipeRes.json();
```

### Follow User Flow
```javascript
// 1. Check if following
const checkRes = await fetch('/api/users/johndoe/follow');
const { isFollowing } = await checkRes.json();

// 2. Toggle follow state
const method = isFollowing ? 'DELETE' : 'POST';
await fetch('/api/users/johndoe/follow', { method });
```