# Component Interfaces

## Overview

This document defines the interfaces, props, and composition patterns for all components in the RecipeNest platform. Components are organized by category and include detailed type definitions, usage examples, and best practices.

## Form Components

### RecipeForm
**Purpose**: Comprehensive form for creating and editing recipes

**Props Interface**:
```typescript
interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  mode: 'create' | 'edit';
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}
```

**Form Data Interface**:
```typescript
interface RecipeFormData {
  title: string;
  summary: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prep_time: number;
  cook_time: number;
  ingredients: IngredientInput[];
  steps: StepInput[];
  categories: number[];
  is_public: boolean;
  cover_image?: File;
}

interface IngredientInput {
  text: string;
  position: number;
}

interface StepInput {
  text: string;
  position: number;
}
```

**Usage Example**:
```typescript
<RecipeForm
  mode="create"
  onSubmit={handleCreateRecipe}
  onCancel={() => router.back()}
  isLoading={isSubmitting}
/>
```

**Features**:
- **Dynamic Fields**: Add/remove ingredients and steps
- **Image Upload**: Drag-and-drop cover image upload
- **Category Selection**: Multi-select category picker
- **Validation**: Real-time form validation with Zod
- **Auto-save**: Automatic draft saving during composition

### ProfileForm
**Purpose**: User profile editing and management

**Props Interface**:
```typescript
interface ProfileFormProps {
  initialData: Profile;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}
```

**Form Data Interface**:
```typescript
interface ProfileFormData {
  display_name: string;
  bio: string;
  avatar?: File;
}
```

**Usage Example**:
```typescript
<ProfileForm
  initialData={userProfile}
  onSubmit={handleUpdateProfile}
  onCancel={() => setEditing(false)}
  isLoading={isUpdating}
/>
```

**Features**:
- **Avatar Upload**: Profile picture management
- **Bio Editor**: Rich text biography editing
- **Validation**: Username and display name validation
- **Preview**: Real-time profile preview

### SearchForm
**Purpose**: Advanced recipe search with filters

**Props Interface**:
```typescript
interface SearchFormProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  onSearch: (query: string, filters: SearchFilters) => void;
  categories: Category[];
  isLoading?: boolean;
}
```

**Search Filters Interface**:
```typescript
interface SearchFilters {
  category?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  prep_time_max?: number;
  cook_time_max?: number;
  sort_by: 'relevance' | 'newest' | 'popular' | 'alphabetical';
}
```

**Usage Example**:
```typescript
<SearchForm
  initialQuery="chocolate cookies"
  initialFilters={{ difficulty: 'Easy', sort_by: 'popular' }}
  onSearch={handleSearch}
  categories={availableCategories}
  isLoading={isSearching}
/>
```

**Features**:
- **Real-time Search**: Instant search results as user types
- **Advanced Filters**: Multiple filter criteria
- **Sort Options**: Various sorting algorithms
- **Search History**: Recent search queries
- **Filter Presets**: Saved filter combinations

## UI Components

### RecipeCard
**Purpose**: Display recipe information in a compact card format

**Props Interface**:
```typescript
interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onLike?: (recipeId: number) => void;
  onSave?: (recipeId: number) => void;
  onShare?: (recipeId: number) => void;
  className?: string;
}
```

**Recipe Interface**:
```typescript
interface Recipe {
  id: number;
  title: string;
  slug: string;
  summary: string;
  cover_image_key: string | null;
  author: {
    username: string;
    display_name: string | null;
    avatar_key: string | null;
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prep_time: number;
  cook_time: number;
  like_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  created_at: string;
}
```

**Usage Example**:
```typescript
<RecipeCard
  recipe={recipeData}
  variant="featured"
  showActions={true}
  onLike={handleLike}
  onSave={handleSave}
  onShare={handleShare}
  className="hover:shadow-lg transition-shadow"
/>
```

**Variants**:
- **Default**: Standard recipe card with full information
- **Compact**: Minimal information for grid layouts
- **Featured**: Enhanced styling for highlighted recipes

**Features**:
- **Responsive Design**: Adapts to different screen sizes
- **Image Optimization**: Lazy loading and responsive images
- **Action Buttons**: Like, save, and share functionality
- **Hover Effects**: Interactive visual feedback
- **Accessibility**: Proper ARIA labels and keyboard navigation

### UserCard
**Purpose**: Display user profile information in a compact format

**Props Interface**:
```typescript
interface UserCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact' | 'detailed';
  showStats?: boolean;
  showActions?: boolean;
  isFollowing?: boolean;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  className?: string;
}
```

**User Profile Interface**:
```typescript
interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  recipe_count: number;
}
```

**Usage Example**:
```typescript
<UserCard
  user={userProfile}
  variant="detailed"
  showStats={true}
  showActions={true}
  isFollowing={isFollowing}
  onFollow={handleFollow}
  onUnfollow={handleUnfollow}
  className="border rounded-lg p-4"
/>
```

**Variants**:
- **Default**: Standard user card with basic information
- **Compact**: Minimal information for list views
- **Detailed**: Extended information with statistics

**Features**:
- **Avatar Display**: Profile picture with fallback
- **Statistics**: Follower and recipe counts
- **Follow Actions**: Follow/unfollow functionality
- **Bio Preview**: Truncated biography text
- **Link Integration**: Navigation to user profiles

### CommentCard
**Purpose**: Display individual comments with nested replies

**Props Interface**:
```typescript
interface CommentCardProps {
  comment: Comment;
  variant?: 'default' | 'compact' | 'nested';
  showActions?: boolean;
  onReply?: (commentId: string) => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  className?: string;
}
```

**Comment Interface**:
```typescript
interface Comment {
  id: string;
  body: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_key: string | null;
  };
  created_at: string;
  edited_at?: string;
  like_count: number;
  is_liked?: boolean;
  is_editable?: boolean;
  is_deletable?: boolean;
  parent_id?: string;
  replies?: Comment[];
}
```

**Usage Example**:
```typescript
<CommentCard
  comment={commentData}
  variant="nested"
  showActions={true}
  onReply={handleReply}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onLike={handleLike}
  className="border-l-2 border-gray-200 pl-4"
/>
```

**Variants**:
- **Default**: Standard comment display
- **Compact**: Minimal information for list views
- **Nested**: Indented display for reply threads

**Features**:
- **Nested Replies**: Support for comment threading
- **Edit History**: Track comment modifications
- **Like System**: Comment appreciation system
- **Moderation**: Edit and delete capabilities
- **Timestamps**: Relative time display

### CategoryBadge
**Purpose**: Display recipe categories as interactive badges

**Props Interface**:
```typescript
interface CategoryBadgeProps {
  category: Category;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: (categoryId: number) => void;
  className?: string;
}
```

**Category Interface**:
```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}
```

**Usage Example**:
```typescript
<CategoryBadge
  category={categoryData}
  variant="outline"
  size="md"
  clickable={true}
  onClick={handleCategoryClick}
  className="hover:bg-primary hover:text-primary-foreground"
/>
```

**Variants**:
- **Default**: Filled background with primary color
- **Outline**: Bordered with transparent background
- **Ghost**: Minimal styling for subtle display

**Features**:
- **Color Coding**: Visual category identification
- **Interactive**: Clickable for filtering
- **Responsive**: Adapts to different sizes
- **Accessibility**: Proper ARIA labels
- **Icon Support**: Optional category icons

## Layout Components

### MainLayout
**Purpose**: Primary application layout with navigation and footer

**Props Interface**:
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}
```

**Usage Example**:
```typescript
<MainLayout
  showHeader={true}
  showFooter={true}
  maxWidth="xl"
  className="min-h-screen bg-background"
>
  <div>Page content goes here</div>
</MainLayout>
```

**Features**:
- **Responsive Navigation**: Mobile-friendly navigation menu
- **User Authentication**: Login/logout functionality
- **Search Integration**: Global search bar
- **Footer Links**: Important links and information
- **Container Width**: Configurable maximum content width

### DashboardLayout
**Purpose**: User dashboard layout with sidebar navigation

**Props Interface**:
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: 'overview' | 'recipes' | 'saved' | 'profile' | 'settings';
  showSidebar?: boolean;
  className?: string;
}
```

**Usage Example**:
```typescript
<DashboardLayout
  activeSection="recipes"
  showSidebar={true}
  className="bg-gray-50"
>
  <div>Dashboard content goes here</div>
</DashboardLayout>
```

**Features**:
- **Sidebar Navigation**: Quick access to dashboard sections
- **Active States**: Visual indication of current section
- **Responsive Design**: Collapsible sidebar on mobile
- **User Context**: Display user information and stats
- **Quick Actions**: Common user actions

### RecipeLayout
**Purpose**: Recipe-specific page layout with related content

**Props Interface**:
```typescript
interface RecipeLayoutProps {
  children: React.ReactNode;
  recipe: Recipe;
  showRelated?: boolean;
  showComments?: boolean;
  className?: string;
}
```

**Usage Example**:
```typescript
<RecipeLayout
  recipe={recipeData}
  showRelated={true}
  showComments={true}
  className="max-w-4xl mx-auto"
>
  <div>Recipe content goes here</div>
</RecipeLayout>
```

**Features**:
- **Recipe Header**: Title, author, and metadata
- **Related Recipes**: Similar recipe suggestions
- **Comment Section**: User discussion area
- **Social Actions**: Like, save, and share buttons
- **Navigation**: Breadcrumb and related links

### ModalLayout
**Purpose**: Overlay modal with backdrop and close functionality

**Props Interface**:
```typescript
interface ModalLayoutProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}
```

**Usage Example**:
```typescript
<ModalLayout
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Recipe Details"
  size="lg"
  closeOnBackdrop={true}
  closeOnEscape={true}
  className="bg-white rounded-lg shadow-xl"
>
  <div>Modal content goes here</div>
</ModalLayout>
```

**Features**:
- **Backdrop Click**: Close modal by clicking outside
- **Escape Key**: Close modal with Escape key
- **Focus Management**: Proper focus trapping
- **Scroll Lock**: Prevent background scrolling
- **Accessibility**: ARIA labels and keyboard navigation

## Component Patterns

### Compound Components
**Purpose**: Create flexible component combinations with shared state

**Example - RecipeCard with Actions**:
```typescript
interface RecipeCardCompoundProps {
  recipe: Recipe;
  children: React.ReactNode;
}

const RecipeCard = ({ recipe, children }: RecipeCardCompoundProps) => {
  return (
    <div className="recipe-card">
      <RecipeCard.Header recipe={recipe} />
      <RecipeCard.Content recipe={recipe} />
      {children}
    </div>
  );
};

RecipeCard.Header = ({ recipe }: { recipe: Recipe }) => (
  <div className="recipe-header">
    <img src={recipe.cover_image_key} alt={recipe.title} />
    <h3>{recipe.title}</h3>
  </div>
);

RecipeCard.Content = ({ recipe }: { recipe: Recipe }) => (
  <div className="recipe-content">
    <p>{recipe.summary}</p>
    <div className="recipe-meta">
      <span>{recipe.difficulty}</span>
      <span>{recipe.prep_time} min</span>
    </div>
  </div>
);

RecipeCard.Actions = ({ recipe, onLike, onSave }: RecipeCardActionsProps) => (
  <div className="recipe-actions">
    <button onClick={() => onLike(recipe.id)}>Like</button>
    <button onClick={() => onSave(recipe.id)}>Save</button>
  </div>
);
```

**Usage**:
```typescript
<RecipeCard recipe={recipeData}>
  <RecipeCard.Actions
    recipe={recipeData}
    onLike={handleLike}
    onSave={handleSave}
  />
</RecipeCard>
```

### Render Props Pattern
**Purpose**: Pass rendering logic as props for flexible component behavior

**Example - DataFetcher Component**:
```typescript
interface DataFetcherProps<T> {
  fetchFn: () => Promise<T>;
  children: (data: T | null, loading: boolean, error: string | null) => React.ReactNode;
  fallback?: React.ReactNode;
}

function DataFetcher<T>({ fetchFn, children, fallback }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchFn]);

  if (loading && fallback) {
    return <>{fallback}</>;
  }

  return <>{children(data, loading, error)}</>;
}
```

**Usage**:
```typescript
<DataFetcher
  fetchFn={() => getRecipes()}
  fallback={<RecipeSkeleton />}
>
  {(recipes, loading, error) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!recipes) return <div>No recipes found</div>;
    
    return (
      <div className="recipe-grid">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    );
  }}
</DataFetcher>
```

### Higher-Order Components (HOCs)
**Purpose**: Enhance components with additional functionality

**Example - withErrorBoundary HOC**:
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface WithErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  { fallback: FallbackComponent }: WithErrorBoundaryProps = {}
) {
  return function WithErrorBoundaryWrapper(props: P) {
    const [state, setState] = useState<ErrorBoundaryState>({
      hasError: false,
      error: null
    });

    if (state.hasError) {
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={state.error!}
            reset={() => setState({ hasError: false, error: null })}
          />
        );
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return (
      <ErrorBoundary
        onError={(error) => setState({ hasError: true, error })}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

**Usage**:
```typescript
const RecipeCardWithErrorBoundary = withErrorBoundary(RecipeCard, {
  fallback: ({ error, reset }) => (
    <div className="recipe-error">
      <p>Failed to load recipe: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )
});
```

### Custom Hooks Pattern
**Purpose**: Extract reusable logic into custom hooks

**Example - useRecipeActions Hook**:
```typescript
interface UseRecipeActionsProps {
  recipeId: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
}

interface UseRecipeActionsReturn {
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  isLoading: boolean;
  handleLike: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleShare: () => Promise<void>;
}

function useRecipeActions({
  recipeId,
  initialLiked = false,
  initialSaved = false
}: UseRecipeActionsProps): UseRecipeActionsReturn {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await toggleLike(recipeId);
      if (result.success) {
        setIsLiked(result.isLiked);
        setLikeCount(result.likeCount);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await toggleSave(recipeId);
      if (result.success) {
        setIsSaved(result.isSaved);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this recipe!',
          url: `/r/${recipeId}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/r/${recipeId}`);
        // Show toast notification
      }
    } catch (error) {
      console.error('Failed to share recipe:', error);
    }
  };

  return {
    isLiked,
    isSaved,
    likeCount,
    isLoading,
    handleLike,
    handleSave,
    handleShare
  };
}
```

**Usage**:
```typescript
function RecipeCard({ recipe }: { recipe: Recipe }) {
  const {
    isLiked,
    isSaved,
    likeCount,
    isLoading,
    handleLike,
    handleSave,
    handleShare
  } = useRecipeActions({
    recipeId: recipe.id,
    initialLiked: recipe.is_liked,
    initialSaved: recipe.is_saved
  });

  return (
    <div className="recipe-card">
      {/* Recipe content */}
      <div className="recipe-actions">
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={isLiked ? 'text-red-500' : 'text-gray-400'}
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={isSaved ? 'text-blue-500' : 'text-gray-400'}
        >
          {isSaved ? '📌' : '📍'}
        </button>
        <button onClick={handleShare}>
          📤
        </button>
      </div>
    </div>
  );
}
```

## Best Practices

### Component Design Principles
1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition for flexible component behavior
3. **Props Interface**: Always define clear TypeScript interfaces for props
4. **Default Props**: Provide sensible defaults for optional props
5. **Error Boundaries**: Wrap components with error boundaries for graceful failure

### Performance Optimization
1. **Memoization**: Use React.memo for expensive components
2. **Callback Optimization**: Use useCallback for event handlers
3. **State Optimization**: Minimize unnecessary re-renders
4. **Lazy Loading**: Implement lazy loading for non-critical components
5. **Bundle Splitting**: Split components into separate bundles when possible

### Accessibility Guidelines
1. **ARIA Labels**: Provide proper ARIA labels for interactive elements
2. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
3. **Focus Management**: Proper focus trapping and management
4. **Screen Reader Support**: Test with screen readers for accessibility
5. **Color Contrast**: Maintain sufficient color contrast ratios

### Testing Considerations
1. **Unit Tests**: Test individual component functionality
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Verify accessibility compliance
4. **Visual Regression Tests**: Ensure consistent visual appearance
5. **Performance Tests**: Monitor component performance metrics

## Future Enhancements

### Planned Component Additions
- **Advanced Search Components**: Enhanced search with filters and sorting
- **Real-time Components**: Live updates and notifications
- **Mobile-Optimized Components**: Touch-friendly mobile interfaces
- **Accessibility Components**: Enhanced accessibility features
- **Internationalization Components**: Multi-language support

### Component Library Expansion
- **Design System**: Comprehensive design token system
- **Component Documentation**: Interactive component playground
- **Theme Support**: Multiple theme and color scheme support
- **Animation Library**: Consistent animation patterns
- **Icon System**: Comprehensive icon library integration

### Performance Improvements
- **Virtual Scrolling**: For large lists and grids
- **Image Optimization**: Advanced image loading strategies
- **Bundle Optimization**: Improved code splitting and tree shaking
- **Caching Strategies**: Enhanced component and data caching
- **Lazy Loading**: Progressive component loading
