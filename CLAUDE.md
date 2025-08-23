# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                 # Start development server on http://localhost:3000

# Build & Production
npm run build              # Build production bundle
npm start                  # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking

# Database & Storage
npm run db:seed            # Seed database with test data (tsx src/scripts/seed-database.ts)
npm run test:storage       # Test storage configuration (tsx src/scripts/test-storage.ts)
```

### Testing Individual Components
```bash
# Run specific TypeScript files directly
npx tsx src/scripts/[filename].ts

# Test API routes
curl http://localhost:3000/api/[route]
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Forms**: react-hook-form + zod validation
- **State**: AuthContext for global auth, local state for UI

### Core Architecture Patterns

#### 1. Server-First Approach
The app prioritizes Server Components (default) over Client Components. Use `"use client"` only when needed for:
- Interactive features (onClick, onChange)
- Browser APIs (localStorage, window)
- State management (useState, useEffect)
- Form handling with react-hook-form

#### 2. Data Flow Pattern
```
User Request → Next.js Router → Server Component 
→ Supabase Query (with RLS) → Render HTML → Client
```

#### 3. Supabase Client Usage
- **Server**: Use `getServerSupabase()` from `src/lib/db/server.ts`
- **Client**: Use `createClient()` from `src/lib/supabase/client.ts`
- **NEVER** expose service role key in client-side code

### Key Routes & Pages

#### Public Routes
- `/` - Landing page (redirects auth users to /dashboard)
- `/discover` - Unified recipe discovery with tabs (Explore/Following/Popular/Recent)
- `/r/[id-slug]` - Public recipe view
- `/u/[username]` - Public user profile

#### Authenticated Routes
- `/dashboard` - User dashboard with stats, trending recipes, and following feed
- `/profile` - User's own profile page with stats and quick actions
- `/my-recipes` - Manage user's own recipes (CRUD operations)
- `/saved-recipes` - View saved/bookmarked recipes
- `/recipes/new` - Create new recipe
- `/recipes/edit/[id]` - Edit existing recipe
- `/connections/followers` - View followers list
- `/connections/following` - View following list
- `/interactions/likes` - View liked recipes
- `/interactions/comments` - View comments on recipes

### Database Schema

The app uses Supabase with Row Level Security (RLS) enabled on all tables:

- **profiles** - User profiles linked to auth.users
- **recipes** - Recipe content with search vectors
- **recipe_ingredients** - Ordered ingredient lists
- **recipe_steps** - Ordered cooking steps
- **follows** - User follow relationships
- **likes** - Recipe likes (one per user per recipe)
- **saves** - Recipe bookmarks
- **categories** - Recipe categories
- **recipe_categories** - Many-to-many recipe-category relations
- **recipe_comments** - Comments on recipes

### Important Patterns

#### Server Actions
Located in `/app/_actions/`, used for form submissions and mutations:
```typescript
"use server";
// Always validate input with zod
// Use getServerSupabase() for database access
// Call revalidatePath() after mutations
```

#### API Routes
Located in `/app/api/`, handle complex queries and non-form operations:
```typescript
// Always validate with zod
// Return typed responses
// Handle errors gracefully
```

#### Optimized Queries
Use single queries with joins instead of N+1:
```typescript
const { data } = await supabase
  .from('recipes')
  .select(`
    *,
    author:profiles!inner(*),
    recipe_ingredients(*),
    recipe_steps(*)
  `)
```

### File Organization

- Components using a specific page's data stay in that page's directory
- Shared components go in `/src/components/`
- Database utilities in `/src/lib/db/`
- Validation schemas in `/src/lib/validation/`
- Type definitions in `/src/types/`

### Critical Rules from Cursor Rules

1. **Database Changes**: All schema changes must be documented in `docs/database_context.md`
2. **Security**: RLS policies must match PRD requirements
3. **Performance**: Use next/image, optimize queries with indexes
4. **Forms**: Always validate with zod, show inline errors
5. **Storage**: Recipe images go in `recipe-images` bucket (public read, auth write)

### Common Development Tasks

#### Adding a New Feature
1. Check PRD in `docs/RecipeNest_PRD.md` for requirements
2. Update database schema if needed (document in `docs/database_context.md`)
3. Create Server Component for page (prefer SSR)
4. Add Client Components only for interactivity
5. Implement Server Action or API route for mutations
6. Add zod validation schemas
7. Test with both authenticated and anonymous users

#### Current Page Structure
- **Dashboard** (`/dashboard`) - Shows user stats, trending recipes, and following feed
- **Profile** (`/profile`) - Client component showing user info, stats, and quick actions
- **My Recipes** (`/my-recipes`) - Client component for managing user's recipes with CRUD
- **Saved Recipes** (`/saved-recipes`) - Server component showing bookmarked recipes
- **Discover** (`/discover`) - Client component with tabbed interface for recipe discovery

#### Debugging Database Issues
1. Check RLS policies in Supabase dashboard
2. Verify user authentication state
3. Test queries in Supabase SQL editor
4. Check `docs/database_context.md` for schema details

#### Working with Images
- Upload to Supabase Storage `recipe-images` bucket
- Store only the key (not full URL) in database
- Use Next.js Image component for optimization
- Handle upload errors gracefully

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # Server-only, never expose to client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Documentation References

- **Product Requirements**: `docs/RecipeNest_PRD.md`
- **Database Schema**: `docs/database_context.md`
- **Architecture Details**: `docs/ARCHITECTURE.md`
- **Development History**: `docs/PROJECT_HISTORY.md`
- **Cursor Rules**: `.cursor/rules/cursor-rules.txt`