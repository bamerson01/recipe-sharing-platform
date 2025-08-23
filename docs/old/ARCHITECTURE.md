# Architecture Documentation

## System Overview

The RecipeNest platform is a Next.js 15 application using the App Router, Supabase for backend services, and Tailwind CSS for styling. The architecture emphasizes server-side rendering, optimized database queries, and a clean separation of concerns.

## 📚 **Documentation Structure**

This project maintains comprehensive documentation across several focused files:

- **[PROJECT_HISTORY.md](./PROJECT_HISTORY.md)** - Complete development history, decisions, and context
- **[CHANGELOG.md](./CHANGELOG.md)** - Official release notes and version history  
- **[database_context.md](./database_context.md)** - Current database schema and policies
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and patterns (this file)

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # App layout group (future use)
│   ├── (marketing)/       # Marketing layout group (future use)
│   ├── _actions/          # Server actions
│   ├── api/               # API routes
│   ├── auth/              # Authentication page
│   ├── dashboard/         # User dashboard (SSR)
│   ├── discover/          # Unified discovery page
│   ├── onboarding/        # User onboarding flow
│   ├── profile/           # User profile with tabs
│   ├── r/                 # Recipe detail pages
│   ├── recipes/           # Recipe management
│   ├── saved/             # Saved recipes (SSR)
│   ├── u/                 # Public user profiles
│   └── page.tsx           # Landing/redirect logic
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── comments/         # Comment system
│   ├── ui/               # Shadcn UI components
│   └── *.tsx             # Shared components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── auth/            # Auth utilities
│   ├── db/              # Database utilities
│   ├── images/          # Image handling
│   └── supabase/        # Supabase client
├── scripts/              # Database scripts
└── types/                # TypeScript definitions
```

## Core Architecture Principles

### 1. Server-First Approach

We prioritize server-side rendering (SSR) for:
- **Better Performance**: Initial page loads are faster
- **SEO Optimization**: Content is crawlable
- **Reduced Client Bundle**: Less JavaScript sent to client

```typescript
// Server Component Example
export default async function DashboardPage() {
  const data = await fetchServerData();
  return <DashboardContent data={data} />;
}
```

### 2. Component Architecture

#### Server Components (Default)
- Data fetching
- Static content
- Layout components
- Non-interactive UI

#### Client Components
- Interactive features
- Browser APIs
- Event handlers
- State management

```typescript
// Client Component
"use client";
export function InteractiveRecipeCard() {
  const [liked, setLiked] = useState(false);
  // Interactive logic
}
```

### 3. Data Flow

```
User Request
    ↓
Next.js Router
    ↓
Server Component (fetch data)
    ↓
Database Query (Supabase)
    ↓
Render HTML
    ↓
Send to Client
    ↓
Hydrate Interactive Parts
```

## Database Architecture

### Schema Overview

```sql
-- Core Tables
profiles (users)
  ├── recipes (1:many)
  ├── saves (1:many)
  ├── likes (1:many)
  └── follows (1:many)

recipes
  ├── recipe_ingredients (1:many)
  ├── recipe_steps (1:many)
  ├── recipe_categories (many:many)
  ├── comments (1:many)
  ├── likes (1:many)
  └── saves (1:many)

categories
  └── recipe_categories (many:many)
```

### Query Optimization

We use single queries with joins instead of N+1 queries:

```typescript
// Optimized Query Pattern
const { data } = await supabase
  .from('recipes')
  .select(`
    *,
    author:profiles!inner(*),
    recipe_ingredients(*),
    recipe_steps(*),
    recipe_categories(
      categories(*)
    )
  `)
  .eq('id', recipeId)
  .single();
```

## Page Architecture

### 1. Landing Page (`/`)
- **Purpose**: Marketing and onboarding
- **Auth State**: Redirects authenticated users to dashboard
- **Components**: Server-rendered landing page

### 2. Dashboard (`/dashboard`)
- **Purpose**: Authenticated user home
- **Features**: Stats, recent activity, quick actions
- **Rendering**: Server-side with suspense boundaries

### 3. Discover (`/discover`)
- **Purpose**: Unified recipe discovery
- **Features**: 
  - Explore tab (search/filter)
  - Following tab (authenticated)
  - Popular tab
  - Recent tab
- **Rendering**: Client-side with search params

### 4. Profile (`/profile`)
- **Purpose**: User management hub
- **Features**:
  - My Recipes tab (with CRUD)
  - Saved Recipes tab
  - Profile editing
- **Rendering**: Hybrid SSR + client interactions

### 5. Recipe Pages
- **Create**: `/recipes/new`
- **Edit**: `/recipes/edit/[id]`
- **View**: `/r/[id-slug]`
- **Public Profile**: `/u/[username]`

## State Management

### Global State
- **AuthContext**: User authentication state
- **Provided at**: Root layout level
- **Consumed by**: All authenticated features

### Local State
- **Component State**: useState for UI state
- **Form State**: React Hook Form for forms
- **Cache State**: SWR/React Query (future)

## API Architecture

### Route Handlers
Located in `/app/api/`, handling:
- Recipe CRUD operations
- User interactions (likes, saves, follows)
- Search and filtering
- Feed generation

### Server Actions
Located in `/app/_actions/`, handling:
- Form submissions
- Data mutations
- Revalidation triggers

Example:
```typescript
"use server";
export async function createRecipe(data: FormData) {
  // Validate
  // Insert to database
  // Revalidate cache
  // Redirect
}
```

## Performance Optimizations

### 1. Database
- **Single Queries**: Join related data in one query
- **Indexes**: On frequently queried columns
- **Connection Pooling**: Via Supabase

### 2. Images
- **Storage**: Supabase Storage with CDN
- **Optimization**: Next.js Image component
- **Lazy Loading**: Automatic with Next.js

### 3. Code Splitting
- **Route-based**: Automatic with App Router
- **Component-based**: Dynamic imports for heavy components

### 4. Caching
- **Static Generation**: Where possible
- **ISR**: For semi-static content
- **Client Cache**: Browser caching strategies

## Security Architecture

### Authentication
- **Provider**: Supabase Auth
- **Method**: JWT tokens
- **Storage**: Secure HTTP-only cookies

### Authorization
- **Row Level Security**: Supabase RLS policies
- **API Protection**: Middleware checks
- **CSRF Protection**: Built into Next.js

### Data Validation
- **Client**: Zod schemas
- **Server**: Additional validation
- **Database**: Constraints and triggers

## Deployment Architecture

### Infrastructure
```
Vercel (Frontend)
    ↓
Supabase (Backend)
    ├── PostgreSQL (Database)
    ├── Auth Service
    ├── Storage (Images)
    └── Edge Functions
```

### CI/CD Pipeline
1. Push to GitHub
2. Vercel auto-deploys
3. Run build checks
4. Deploy to production

## Monitoring & Analytics

### Performance Monitoring
- Vercel Analytics
- Web Vitals tracking
- Error boundary reporting

### User Analytics
- Page views
- User interactions
- Feature usage

## Future Considerations

### Planned Improvements
1. **Real-time Features**: WebSocket for live updates
2. **PWA Support**: Offline capabilities
3. **Internationalization**: Multi-language support
4. **Advanced Search**: Elasticsearch integration
5. **CDN Optimization**: Edge caching strategies

### Scalability Plans
- Database read replicas
- Redis caching layer
- Microservices for heavy operations
- GraphQL API layer

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### Component Guidelines
1. Prefer server components
2. Colocate related code
3. Extract reusable logic
4. Document complex patterns

### Performance Guidelines
1. Minimize client JavaScript
2. Optimize images
3. Lazy load when appropriate
4. Monitor bundle size

### Security Guidelines
1. Never trust client input
2. Use parameterized queries
3. Implement rate limiting
4. Regular dependency updates

## Database Layer

### Foreign Key Relationships
The application uses a **hybrid approach** for handling database relationships:

#### ✅ Automatic Foreign Key Joins (Working)
- **recipe_comments** → **profiles** and **recipes** tables
- Supabase automatically detects and handles these relationships
- Used in: Comment fetching and display

#### 🔧 Manual Joins (Current Solution)
- **follows** → **profiles** tables
- **likes** → **profiles** and **recipes** tables
- Implemented due to Supabase schema cache issues

**Note**: All code has been updated to use the correct column name `followed_id` (not `following_id`) for consistency with the database schema.

#### Manual Join Implementation Pattern
```typescript
// 1. Fetch relationship data
const { data: follows } = await supabase
  .from('follows')
  .select('id, created_at, follower_id')
  .eq('followed_id', userId);

// 2. Extract related IDs
const followerIds = follows.map(f => f.follower_id);

// 3. Fetch related data using IN clause
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username, display_name, avatar_key')
  .in('id', followerIds);

// 4. Transform with Map-based lookup
const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
const transformedData = follows.map(follow => ({
  ...profileMap.get(follow.follower_id),
  followed_at: follow.created_at
}));
```

#### Benefits of Manual Joins
- **Reliability**: Works regardless of schema cache issues
- **Performance**: Batch queries with efficient IN clauses
- **Control**: Full control over data transformation
- **Debugging**: Easier to troubleshoot and optimize

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:

- **profiles**: Public read, owner write
- **recipes**: Public read for public recipes, owner full access
- **likes**: Public read, owner insert/delete
- **saves**: Owner-only access
- **follows**: Public read for counts, owner management
- **recipe_comments**: Public read, owner insert/delete

### Database Functions & Triggers
- **Count Maintenance**: Automatic follower, following, and like count updates
- **Search Vectors**: Automatic tsvector updates for full-text search
- **Timestamps**: Automatic updated_at maintenance

## Data Fetching Strategy

### Server Actions Pattern
The application uses Next.js Server Actions for all data mutations:

```typescript
// Example: Follow user action
export async function followUser(userIdToFollow: string) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, followed_id: userIdToFollow });
    
  return { success: !error, error: error?.message };
}
```

### Data Fetching Patterns
1. **Server Components**: Direct database queries for initial page loads
2. **Client Components**: Server actions for user interactions
3. **Optimistic Updates**: Immediate UI updates with rollback on failure
4. **Batch Operations**: Efficient data fetching with IN clauses

### Caching Strategy
- **Next.js Cache**: Automatic caching of server component data
- **Revalidation**: Manual revalidation after mutations
- **Tags**: Cache invalidation using Next.js cache tags

## Component Architecture

### Server vs Client Components
**Default**: Server Components for data fetching and static content
**Client Components**: Only when interactivity is required

#### Server Component Example
```typescript
// Server component for data fetching
export default async function FollowersList({ userId }: { userId: string }) {
  const followers = await getFollowers(userId, 1, 10);
  
  return (
    <div>
      {followers.map(follower => (
        <FollowerCard key={follower.id} follower={follower} />
      ))}
    </div>
  );
}
```

#### Client Component Example
```typescript
// Client component for interactivity
'use client';

export function FollowButton({ userId }: { userId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFollow = async () => {
    setIsLoading(true);
    const result = await followUser(userId);
    if (result.success) setIsFollowing(!isFollowing);
    setIsLoading(false);
  };
  
  return (
    <Button onClick={handleFollow} disabled={isLoading}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
```

### Component Composition
- **Atomic Design**: Small, focused components
- **Composition over Inheritance**: Flexible component combinations
- **Props Interface**: Strict TypeScript interfaces for all props
- **Error Boundaries**: Graceful error handling for client islands

## State Management

### Server State (Primary)
- **Database**: Single source of truth
- **Server Components**: Direct data access
- **Server Actions**: Mutations and updates
- **Cache**: Next.js automatic caching

### Client State (Minimal)
- **UI State**: Loading, error, form states
- **Optimistic Updates**: Immediate feedback
- **User Preferences**: Theme, language, etc.

### State Synchronization
- **Revalidation**: Automatic cache updates
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Graceful fallbacks and rollbacks

## Security Architecture

### Authentication
- **Supabase Auth**: JWT-based authentication
- **Middleware**: Route protection and redirects
- **Session Management**: Automatic token refresh

### Authorization
- **RLS Policies**: Database-level security
- **Server Actions**: Server-side validation
- **Input Sanitization**: Comprehensive validation with Zod

### Rate Limiting
- **In-Memory**: Current implementation
- **Configurable**: Different limits per endpoint
- **Middleware**: Applied at Next.js level

## Performance Optimization

### Database Optimization
- **Indexes**: Strategic indexing for common queries
- **Batch Queries**: Efficient data fetching patterns
- **Connection Pooling**: Supabase connection management

### Frontend Optimization
- **Code Splitting**: Automatic Next.js optimization
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring

### Caching Strategy
- **Static Generation**: Where possible
- **Incremental Static Regeneration**: For dynamic content
- **Edge Caching**: Vercel edge network

## Error Handling

### Graceful Degradation
- **Fallback UI**: Alternative content when operations fail
- **Error Boundaries**: Client-side error isolation
- **User Feedback**: Clear error messages and recovery options

### Logging & Monitoring
- **Server Logs**: Comprehensive error logging
- **Client Errors**: Error boundary reporting
- **Performance Monitoring**: Response time tracking

## Testing Strategy

### Manual Testing
- **User Flows**: Complete user journey testing
- **Edge Cases**: Error condition testing
- **Performance**: Load testing and optimization

### Automated Testing (Planned)
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing

## Deployment & Infrastructure

### Vercel Deployment
- **Automatic Deploys**: Git-based deployment
- **Preview Deploys**: Pull request testing
- **Environment Variables**: Secure configuration

### Supabase Integration
- **Database**: PostgreSQL with RLS
- **Storage**: File uploads and management
- **Authentication**: User management and sessions

## Future Considerations

### Scalability
- **Database**: Connection pooling and query optimization
- **Caching**: Redis implementation for better performance
- **CDN**: Global content distribution

### Monitoring
- **APM**: Application performance monitoring
- **Error Tracking**: Comprehensive error reporting
- **Analytics**: User behavior insights

### Testing
- **Test Suite**: Comprehensive automated testing
- **CI/CD**: Automated testing and deployment
- **Performance**: Regular performance audits