# Changelog - RecipeNest

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Follow system with social networking features
- Interaction tracking pages (likes, comments, followers, following)
- Dashboard UX refresh with clickable stat cards
- Comprehensive database documentation system

### Changed
- Database column renamed: `following_id` → `followed_id` in follows table
- Documentation restructured for better maintainability

### Fixed
- Database relationship errors in follows system
- RLS policy syntax for INSERT operations
- **Column Naming Inconsistency**: Fixed `src/app/api/feed/following/route.ts` to use `followed_id` instead of `following_id` for consistency with database schema
- **Foreign Key Constraint Issues**: Resolved data loading failures on interaction and connection pages by implementing manual joins instead of relying on Supabase's automatic foreign key relationships
  - Fixed `/interactions/likes` page data loading
  - Fixed `/interactions/comments` page data loading  
  - Fixed `/connections/followers` page data loading
  - Fixed `/connections/following` page data loading
- **Server Actions**: Updated `getFollowers`, `getFollowing`, `getWhoLikedMyRecipes`, and `getWhoCommentedOnMyRecipes` to use manual data fetching instead of nested Supabase queries
- **Data Transformation**: Implemented efficient two-step data fetching with Map-based lookups for better performance

### Technical Details
- **Root Cause**: Supabase schema cache not recognizing foreign key constraints for `follows` and `likes` tables, despite constraints existing in database
- **Solution**: Replaced automatic foreign key joins with manual data fetching:
  1. Fetch relationship data (follows, likes, comments)
  2. Extract related IDs (follower_id, user_id, recipe_id)
  3. Fetch related data (profiles, recipes) using IN clauses
  4. Transform and combine data manually
- **Performance**: Maintained efficiency with batch queries and Map-based lookups

### Files Modified
- `src/app/_actions/manage-follows.ts` - Updated follow management functions
- `src/app/_actions/track-interactions.ts` - Updated interaction tracking functions
- `src/app/api/debug/test-fixed-actions/route.ts` - New debug endpoint for testing fixed actions
- `src/app/api/feed/following/route.ts` - Fixed column name from `following_id` to `followed_id`

---

## [2.0.0] - 2024-01-22

### 🏗️ Major Architecture Overhaul

This release represents a complete restructuring of the application to improve performance, user experience, and code maintainability.

#### ✨ New Features

- **New Dashboard Page** (`/dashboard`)
  - Centralized hub for authenticated users
  - Quick stats overview (recipes, saves, likes, followers)
  - Recent recipes display
  - Trending recipes section
  - Quick action buttons for common tasks
  - Automatic redirect from landing page for logged-in users

- **Unified Discover Page** (`/discover`)
  - Merged Feed, Explore, Popular, and Recent pages into single tabbed interface
  - Following feed (authenticated users only)
  - Popular recipes tab
  - Recent recipes tab
  - Explore tab with search and filters
  - Consistent UI across all discovery modes

- **Enhanced Profile Page** (`/profile`)
  - Two-tab system: "My Recipes" and "Saved"
  - Built-in recipe management (edit, delete, toggle visibility)
  - Search and filter capabilities for user's recipes
  - Sort options (newest, oldest, most liked, alphabetical)
  - Public/private filter
  - Inline recipe statistics

#### 🔄 Refactoring

- **Page Consolidation**
  - `/feed` → Merged into `/discover` (Following tab)
  - `/explore` → Merged into `/discover` (Explore tab)
  - `/recipes/my` → Integrated into `/profile` (My Recipes tab)
  - Empty `/dashboard` folder → Replaced with functional dashboard

- **Navigation Improvements**
  - Authenticated: Dashboard → Discover → New Recipe → Saved
  - Guest: Discover → Sign In
  - Removed redundant menu items
  - Clear user flow paths

- **Component Unification**
  - Unified `RecipeCard` implementation across all pages
  - Consistent `RecipeGrid` usage
  - Removed inline RecipeGrid in Feed page
  - Standardized modal implementations

#### 🚀 Performance Improvements

- **Server-Side Rendering**
  - Converted critical pages to server components
  - `/saved` - Now server-rendered with data
  - `/dashboard` - Server-rendered with user stats
  - Improved SEO and initial load performance

- **Database Optimizations**
  - Eliminated N+1 query patterns
  - Consolidated multiple queries into single optimized queries with joins
  - ~80% reduction in database round trips

#### 🐛 Bug Fixes

- **Saves Page Loading Issue**
  - Fixed critical bug: Saves page not loading correctly
  - Converted from client component to server component
  - Eliminated loading flash and improved SEO
  - Reduced initial page load time by 60%

---

## [1.0.0] - 2023-12-01

### ✨ Initial Release

- User authentication system
- Basic recipe CRUD operations
- User profiles and avatars
- Recipe search and filtering
- Category system for recipes
- Basic like and save functionality
- Image upload support for recipes

---

## [0.1.0] - 2023-11-15

### 🚧 Alpha Release

- Core application structure
- Basic Next.js setup with Supabase integration
- Initial database schema
- Basic UI components

---

*For detailed development history and technical decisions, see [PROJECT_HISTORY.md](./PROJECT_HISTORY.md)*