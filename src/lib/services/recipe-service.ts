/**
 * Centralized recipe fetching service
 * Consolidates all recipe fetching logic to avoid duplication
 */

import { getServerSupabase } from '@/lib/db/server';
import type { Database } from '@/types/database';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
type RecipeStep = Database['public']['Tables']['recipe_steps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export interface RecipeWithDetails extends Recipe {
  author: Profile | null;
  recipe_ingredients: RecipeIngredient[];
  recipe_steps: RecipeStep[];
  categories: Category[];
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface RecipeSummary extends Recipe {
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_key'>;
  categories?: Category[];
}

export interface FetchRecipesParams {
  userId?: string;
  isPublic?: boolean;
  authorId?: string;
  categoryIds?: number[];
  searchQuery?: string;
  sortBy?: 'newest' | 'oldest' | 'popular';
  limit?: number;
  offset?: number;
}

export class RecipeService {
  /**
   * Base query for fetching recipes with related data
   */
  private static getBaseQuery() {
    return `
      id,
      title,
      slug,
      summary,
      cover_image_key,
      is_public,
      like_count,
      difficulty,
      prep_time,
      cook_time,
      created_at,
      updated_at,
      author_id,
      author:profiles!inner(
        id,
        username,
        display_name,
        avatar_key
      ),
      recipe_ingredients!inner(
        id,
        position,
        text
      ),
      recipe_steps!inner(
        id,
        position,
        text
      ),
      categories:recipe_categories(
        category:categories(
          id,
          name,
          slug
        )
      )
    `;
  }

  /**
   * Fetch recipes with filters and pagination
   */
  static async fetchRecipes(params: FetchRecipesParams): Promise<{
    recipes: RecipeWithDetails[];
    totalCount: number;
  }> {
    const supabase = await getServerSupabase();
    
    let query = supabase
      .from('recipes')
      .select(this.getBaseQuery(), { count: 'exact' });

    // Apply filters
    if (params.isPublic !== undefined) {
      query = query.eq('is_public', params.isPublic);
    }

    if (params.authorId) {
      query = query.eq('author_id', params.authorId);
    }

    if (params.searchQuery) {
      query = query.textSearch('search_vector', params.searchQuery);
    }

    if (params.categoryIds && params.categoryIds.length > 0) {
      query = query.in('id', 
        supabase
          .from('recipe_categories')
          .select('recipe_id')
          .in('category_id', params.categoryIds)
      );
    }

    // Apply sorting
    switch (params.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    // Transform categories data
    const recipes = (data || []).map(recipe => ({
      ...recipe,
      categories: recipe.categories?.map((rc: any) => rc.category).filter(Boolean) || []
    }));

    // If userId is provided, fetch user's likes and saves
    if (params.userId && recipes.length > 0) {
      const recipeIds = recipes.map(r => r.id);
      
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase
          .from('likes')
          .select('recipe_id')
          .eq('user_id', params.userId)
          .in('recipe_id', recipeIds),
        supabase
          .from('saves')
          .select('recipe_id')
          .eq('user_id', params.userId)
          .in('recipe_id', recipeIds)
      ]);

      const likedRecipeIds = new Set(likes?.map(l => l.recipe_id) || []);
      const savedRecipeIds = new Set(saves?.map(s => s.recipe_id) || []);

      recipes.forEach(recipe => {
        recipe.isLiked = likedRecipeIds.has(recipe.id);
        recipe.isSaved = savedRecipeIds.has(recipe.id);
      });
    }

    return {
      recipes: recipes as RecipeWithDetails[],
      totalCount: count || 0
    };
  }

  /**
   * Fetch a single recipe by ID
   */
  static async fetchRecipeById(
    recipeId: number,
    userId?: string
  ): Promise<RecipeWithDetails | null> {
    const supabase = await getServerSupabase();
    
    const { data, error } = await supabase
      .from('recipes')
      .select(this.getBaseQuery())
      .eq('id', recipeId)
      .single();

    if (error || !data) {
      return null;
    }

    // Transform categories
    const recipe = {
      ...data,
      categories: data.categories?.map((rc: any) => rc.category).filter(Boolean) || []
    };

    // Fetch user's like and save status if userId provided
    if (userId) {
      const [{ data: like }, { data: save }] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('saves')
          .select('id')
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      recipe.isLiked = !!like;
      recipe.isSaved = !!save;
    }

    return recipe as RecipeWithDetails;
  }

  /**
   * Fetch recipes for feed (following users)
   */
  static async fetchFollowingFeed(userId: string): Promise<RecipeSummary[]> {
    const supabase = await getServerSupabase();
    
    // Get users the current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (!following || following.length === 0) {
      return [];
    }

    const followingIds = following.map(f => f.following_id);

    // Get recipes from followed users
    const { data: recipes } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        like_count,
        difficulty,
        prep_time,
        cook_time,
        created_at,
        author:profiles!inner(
          id,
          username,
          display_name,
          avatar_key
        ),
        categories:recipe_categories(
          category:categories(
            id,
            name,
            slug
          )
        )
      `)
      .eq('is_public', true)
      .in('author_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50);

    return (recipes || []).map(recipe => ({
      ...recipe,
      categories: recipe.categories?.map((rc: any) => rc.category).filter(Boolean) || []
    })) as RecipeSummary[];
  }

  /**
   * Search recipes with full-text search
   */
  static async searchRecipes(
    query: string,
    filters?: {
      categoryIds?: number[];
      sortBy?: 'popular' | 'recent';
    }
  ): Promise<RecipeSummary[]> {
    const supabase = await getServerSupabase();
    
    let searchQuery = supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        like_count,
        difficulty,
        prep_time,
        cook_time,
        created_at,
        author:profiles!inner(
          id,
          username,
          display_name,
          avatar_key
        ),
        categories:recipe_categories(
          category:categories(
            id,
            name,
            slug
          )
        )
      `)
      .eq('is_public', true);

    // Apply search
    if (query) {
      searchQuery = searchQuery.textSearch('search_vector', query);
    }

    // Apply category filter
    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      // This would need a more complex query or post-filtering
      // For now, we'll handle it differently
    }

    // Apply sorting
    if (filters?.sortBy === 'popular') {
      searchQuery = searchQuery.order('like_count', { ascending: false });
    } else {
      searchQuery = searchQuery.order('created_at', { ascending: false });
    }

    const { data: recipes } = await searchQuery.limit(50);

    return (recipes || []).map(recipe => ({
      ...recipe,
      categories: recipe.categories?.map((rc: any) => rc.category).filter(Boolean) || []
    })) as RecipeSummary[];
  }
}