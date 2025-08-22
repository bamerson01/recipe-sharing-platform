'use server';

import { getServerSupabase } from '@/lib/db/server';

export interface OptimizedRecipe {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  _count?: {
    likes: number;
    saves: number;
  };
}

interface FetchRecipesOptions {
  page?: number;
  limit?: number;
  userId?: string;
  categorySlug?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
}

export async function fetchRecipesOptimized({
  page = 1,
  limit = 12,
  userId,
  categorySlug,
  searchQuery,
  sortBy = 'recent'
}: FetchRecipesOptions = {}) {
  try {
    const supabase = await getServerSupabase();
    const offset = (page - 1) * limit;

    // Build the base query with optimized joins
    let query = supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        is_public,
        like_count,
        created_at,
        updated_at,
        author:profiles!inner(
          id,
          display_name,
          username,
          avatar_url
        ),
        recipe_categories!inner(
          categories!inner(
            id,
            name,
            slug
          )
        )
      `, { count: 'exact' })
      .eq('is_public', true);

    // Apply filters
    if (categorySlug) {
      query = query.eq('recipe_categories.categories.slug', categorySlug);
    }

    if (searchQuery) {
      // Use full-text search if available, otherwise fallback to ILIKE
      query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'trending':
        // Trending: recent recipes with high engagement
        query = query
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('like_count', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: recipes, error, count } = await query;

    if (error) {
      console.error('Error fetching recipes:', error);
      return { 
        ok: false, 
        message: 'Failed to fetch recipes',
        recipes: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page
      } as const;
    }

    // Transform the data to match expected format
    const transformedRecipes: OptimizedRecipe[] = (recipes || []).map(recipe => ({
      ...recipe,
      author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
      categories: recipe.recipe_categories?.map((rc: any) => 
        Array.isArray(rc.categories) ? rc.categories[0] : rc.categories
      ) || []
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      ok: true,
      recipes: transformedRecipes,
      totalCount: count || 0,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    } as const;

  } catch (error) {
    console.error('Unexpected error fetching recipes:', error);
    return { 
      ok: false, 
      message: 'An unexpected error occurred',
      recipes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    } as const;
  }
}

// Optimized function to fetch a single recipe with all details
export async function fetchRecipeDetailsOptimized(slug: string, userId?: string) {
  try {
    const supabase = await getServerSupabase();

    // Fetch everything in a single query when possible
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        is_public,
        like_count,
        created_at,
        updated_at,
        author_id,
        author:profiles!inner(
          id,
          display_name,
          username,
          avatar_url,
          bio
        ),
        recipe_ingredients(
          id,
          position,
          text
        ),
        recipe_steps(
          id,
          position,
          text
        ),
        recipe_categories(
          categories(
            id,
            name,
            slug
          )
        )
      `)
      .eq('slug', slug)
      .single();

    if (error || !recipe) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    // Check access permissions
    if (!recipe.is_public && recipe.author_id !== userId) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    // Check if user has liked/saved (if authenticated)
    let isLiked = false;
    let isSaved = false;
    
    if (userId) {
      const [likeResult, saveResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('recipe_id', recipe.id)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('saves')
          .select('id')
          .eq('recipe_id', recipe.id)
          .eq('user_id', userId)
          .maybeSingle()
      ]);
      
      isLiked = !!likeResult.data;
      isSaved = !!saveResult.data;
    }

    // Transform the data
    const transformedRecipe = {
      ...recipe,
      author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
      ingredients: recipe.recipe_ingredients || [],
      steps: recipe.recipe_steps || [],
      categories: recipe.recipe_categories?.map((rc: any) => rc.categories).flat() || [],
      isLiked,
      isSaved
    };

    return { ok: true, recipe: transformedRecipe } as const;

  } catch (error) {
    console.error('Unexpected error fetching recipe details:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

// Batch fetch user interactions (likes/saves) for multiple recipes
export async function fetchUserInteractions(recipeIds: number[], userId: string) {
  if (!userId || recipeIds.length === 0) {
    return { likes: new Set<number>(), saves: new Set<number>() };
  }

  try {
    const supabase = await getServerSupabase();
    
    const [likesResult, savesResult] = await Promise.all([
      supabase
        .from('likes')
        .select('recipe_id')
        .eq('user_id', userId)
        .in('recipe_id', recipeIds),
      supabase
        .from('saves')
        .select('recipe_id')
        .eq('user_id', userId)
        .in('recipe_id', recipeIds)
    ]);

    return {
      likes: new Set(likesResult.data?.map(l => l.recipe_id) || []),
      saves: new Set(savesResult.data?.map(s => s.recipe_id) || [])
    };
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return { likes: new Set<number>(), saves: new Set<number>() };
  }
}