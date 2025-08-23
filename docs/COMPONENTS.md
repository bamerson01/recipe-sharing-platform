# RecipeNest Component Documentation

## Reusable UI Components

### LoadingSpinner
**Location:** `src/components/ui/loading-spinner.tsx`

A flexible loading indicator component with customizable size and messaging.

#### Props
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Controls spinner size (default: 'md')
- `message?: string` - Optional loading message to display below spinner
- `className?: string` - Additional CSS classes
- `fullScreen?: boolean` - Centers spinner in viewport (default: false)

#### Usage
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Simple usage
<LoadingSpinner />

// With message
<LoadingSpinner message="Loading recipes..." />

// Full screen loading
<LoadingSpinner fullScreen message="Please wait..." />

// Small inline spinner
<LoadingSpinner size="sm" />
```

---

### EmptyState
**Location:** `src/components/ui/empty-state.tsx`

Displays a consistent empty state with icon, message, and optional action.

#### Props
- `icon: LucideIcon` - Icon component to display
- `title: string` - Main heading text
- `description: string` - Descriptive text explaining the empty state
- `action?: { label: string; href?: string; onClick?: () => void; icon?: LucideIcon }` - Optional action button
- `variant?: 'card' | 'inline'` - Display style (default: 'card')
- `className?: string` - Additional CSS classes

#### Usage
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { ChefHat, Plus } from 'lucide-react';

// Basic empty state
<EmptyState
  icon={ChefHat}
  title="No recipes yet"
  description="Start creating your first recipe!"
/>

// With action button
<EmptyState
  icon={ChefHat}
  title="No recipes found"
  description="Try adjusting your search filters"
  action={{
    label: "Create Recipe",
    href: "/recipes/new",
    icon: Plus
  }}
/>

// Inline variant (no card wrapper)
<EmptyState
  variant="inline"
  icon={ChefHat}
  title="Nothing here"
  description="Check back later"
/>
```

---

### RecipeGridSkeleton
**Location:** `src/components/ui/recipe-grid-skeleton.tsx`

Loading skeleton for recipe grids, matching the layout of RecipeCard components.

#### Props
- `count?: number` - Number of skeleton cards to display (default: 6)
- `columns?: 1 | 2 | 3 | 4` - Grid column configuration (default: 3)
- `className?: string` - Additional CSS classes

#### Usage
```tsx
import { RecipeGridSkeleton } from '@/components/ui/recipe-grid-skeleton';

// Default 3-column grid with 6 cards
<RecipeGridSkeleton />

// Custom configuration
<RecipeGridSkeleton count={8} columns={4} />

// Loading state in component
{loading ? (
  <RecipeGridSkeleton count={12} />
) : (
  <RecipeGrid recipes={recipes} />
)}
```

---

## Core Recipe Components

### RecipeCard
**Location:** `src/components/recipe-card-unified.tsx`

Main recipe card component with two variants: default (for viewing) and owner (with edit controls).

#### Features
- **React.memo optimized** to prevent unnecessary re-renders
- **Image optimization** with blur placeholders and lazy loading
- **Two display variants**: default and owner
- **Responsive design** with mobile-first approach
- **Accessibility** features including ARIA labels and keyboard navigation

#### Props
```typescript
interface RecipeCardProps {
  recipe: RecipeSummary;
  variant?: 'default' | 'owner';
  index?: number; // For image priority loading
  onOpenModal?: (recipe: RecipeSummary) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleVisibility?: (id: number, isPublic: boolean) => void;
  onSaveChange?: (id: number, saved: boolean) => void;
}
```

#### Performance Optimizations
- Uses `React.memo` to prevent re-renders unless props change
- First 3 images get `priority` loading for above-the-fold content
- Blur placeholders for smooth image loading experience
- Responsive image sizes based on viewport

---

### RecipeDetailModal
**Location:** `src/components/recipe-detail-modal-unified.tsx`

Full recipe detail view in a modal dialog.

#### Features
- Fetches complete recipe data including ingredients and steps
- Supports both viewing and owner modes
- Integrated like, save, and share functionality
- Responsive layout with tabs for organization

---

## Interactive Components

### LikeButton
**Location:** `src/components/like-button.tsx`

**Optimized with React.memo** - Handles recipe likes with optimistic updates.

#### Features
- Optimistic UI updates for instant feedback
- Debounced API calls to prevent spam
- Guest user handling with auth redirect
- Animated state transitions

---

### SaveButton
**Location:** `src/components/save-button.tsx`

**Optimized with React.memo** - Manages saving recipes to user's cookbook.

#### Features
- Toggle between "Add to Cookbook" and "In Cookbook" states
- Optimistic updates with error recovery
- Guest user handling
- Visual feedback with icon animations

---

### FollowButton
**Location:** `src/components/follow-button.tsx`

Handles user following/unfollowing with real-time state updates.

#### Features
- Automatic follow status checking on mount
- Loading states during operations
- Toast notifications for feedback
- Auto-hides for self-profile viewing

---

## Image Utilities

### Blur Placeholder System
**Location:** `src/lib/images/blur-placeholder.ts`

Provides optimized image loading with blur placeholders.

#### Functions

**`getBlurPlaceholder(type: 'default' | 'shimmer' | 'recipe')`**
- Returns base64-encoded blur placeholder
- `recipe` type uses warm culinary colors
- `shimmer` provides animated loading effect

**`getImageSizes(context: 'card' | 'modal' | 'hero' | 'thumbnail')`**
- Returns responsive sizes string for Next.js Image component
- Optimizes image delivery based on display context

**`shouldPrioritizeImage(index: number, threshold: number = 3)`**
- Determines if image should load with priority
- Used for above-the-fold optimization

#### Usage
```tsx
import { getBlurPlaceholder, getImageSizes } from '@/lib/images/blur-placeholder';

<Image
  src={imageUrl}
  alt={alt}
  fill
  sizes={getImageSizes('card')}
  placeholder="blur"
  blurDataURL={getBlurPlaceholder('recipe')}
  priority={index < 3}
/>
```

---

## Performance Best Practices

### 1. Component Memoization
Components that render frequently (RecipeCard, LikeButton, SaveButton) are wrapped with `React.memo` to prevent unnecessary re-renders.

### 2. Image Optimization
- Use blur placeholders for all recipe images
- Set `priority` prop for first 3 images in lists
- Provide accurate `sizes` prop based on display context

### 3. Loading States
Always use the provided loading components for consistency:
- `LoadingSpinner` for general loading
- `RecipeGridSkeleton` for recipe grids
- `EmptyState` for empty results

### 4. Data Fetching
- Use parallel requests with `Promise.all()` when possible
- Implement proper error boundaries
- Cache responses where appropriate

---

## Accessibility Guidelines

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **ARIA Labels**: Proper labels for screen readers on all buttons and controls
3. **Focus Management**: Modal dialogs trap focus appropriately
4. **Color Contrast**: All text meets WCAG AA standards
5. **Loading States**: Announce loading states to screen readers

---

## Future Improvements

1. **Virtual Scrolling**: Implement for large recipe lists
2. **Intersection Observer**: Lazy load recipe cards as they enter viewport
3. **Service Worker**: Cache recipe images for offline viewing
4. **React Query Integration**: Add proper data caching layer
5. **Suspense Boundaries**: Implement for better loading states