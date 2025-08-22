'use server';

import { getServerSupabase } from '@/lib/db/server';
import type { RecipeSummary, RecipeFull } from '@/types/recipe';

/**
 * Fetch recipe summaries for lists (explore, profile, my recipes, etc)
 */
export async function fetchRecipeSummaries(options: {
  authorId?: string;
  isPublic?: boolean;
  savedByUserId?: string;
  likedByUserId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'popular' | 'title';
}): Promise<{ recipes: RecipeSummary[]; hasMore: boolean }> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  
  // Build base query
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
      difficulty,
      prep_time,
      cook_time,
      created_at,
      updated_at,
      author:profiles!inner(
        id,
        display_name,
        username,
        avatar_key
      )
    `, { count: 'exact' });

  // Apply filters
  if (options.authorId) {
    query = query.eq('author_id', options.authorId);
  }
  
  if (options.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic);
  } else if (!options.authorId || options.authorId !== user?.id) {
    // Only show public recipes unless viewing own
    query = query.eq('is_public', true);
  }

  // Apply sorting
  switch (options.sortBy) {
    case 'popular':
      query = query.order('like_count', { ascending: false });
      break;
    case 'title':
      query = query.order('title', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: recipes, error, count } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    return { recipes: [], hasMore: false };
  }

  // Fetch categories for each recipe
  const recipesWithDetails = await Promise.all(
    (recipes || []).map(async (recipe) => {
      // Fetch categories
      const { data: categories } = await supabase
        .from('recipe_categories')
        .select(`
          categories!inner(
            id,
            name,
            slug
          )
        `)
        .eq('recipe_id', recipe.id);

      // Check user interactions if logged in
      let is_saved = false;
      let is_liked = false;
      
      if (user) {
        const [saveRes, likeRes] = await Promise.all([
          supabase
            .from('saves')
            .select('id')
            .eq('recipe_id', recipe.id)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('likes')
            .select('id')
            .eq('recipe_id', recipe.id)
            .eq('user_id', user.id)
            .single()
        ]);
        
        is_saved = !!saveRes.data;
        is_liked = !!likeRes.data;
      }

      const summary: RecipeSummary = {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        summary: recipe.summary,
        cover_image_key: recipe.cover_image_key,
        like_count: recipe.like_count,
        is_public: recipe.is_public,
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        author: {
          id: (recipe.author as any).id,
          username: (recipe.author as any).username,
          display_name: (recipe.author as any).display_name,
          avatar_key: (recipe.author as any).avatar_key
        },
        categories: categories?.map(c => (c.categories as any)) || [],
        is_saved,
        is_liked
      };

      return summary;
    })
  );

  return {
    recipes: recipesWithDetails,
    hasMore: count ? count > offset + limit : false
  };
}

/**
 * Fetch user's saved recipes
 */
export async function fetchSavedRecipes(userId: string, limit = 20, offset = 0) {
  const supabase = await getServerSupabase();
  
  const { data: saves, error } = await supabase
    .from('saves')
    .select(`
      created_at,
      recipe:recipes!inner(
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
          avatar_key
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching saved recipes:', error);
    return { recipes: [], hasMore: false };
  }

  // Transform and fetch additional details
  const recipes = await Promise.all(
    (saves || []).map(async (save: any) => {
      const recipe = save.recipe;
      
      // Fetch categories
      const { data: categories } = await supabase
        .from('recipe_categories')
        .select(`
          categories!inner(
            id,
            name,
            slug
          )
        `)
        .eq('recipe_id', recipe.id);

      const summary: RecipeSummary = {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        summary: recipe.summary,
        cover_image_key: recipe.cover_image_key,
        like_count: recipe.like_count,
        is_public: recipe.is_public,
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        author: {
          id: (recipe.author as any).id,
          username: (recipe.author as any).username,
          display_name: (recipe.author as any).display_name,
          avatar_key: (recipe.author as any).avatar_key
        },
        categories: categories?.map(c => (c.categories as any)) || [],
        is_saved: true,
        is_liked: false // Would need another query
      };

      return summary;
    })
  );

  return { recipes, hasMore: saves?.length === limit };
}

/**
 * Fetch user's liked recipes
 */
export async function fetchLikedRecipes(userId: string, limit = 20, offset = 0) {
  const supabase = await getServerSupabase();
  
  const { data: likes, error } = await supabase
    .from('likes')
    .select(`
      created_at,
      recipes!inner(
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
          avatar_key
        )
      )
    `)
    .eq('user_id', userId)
    .eq('recipes.is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching liked recipes:', error);
    return { recipes: [], hasMore: false };
  }

  // Transform and fetch additional details
  const recipes = await Promise.all(
    (likes || []).map(async (like: any) => {
      const recipe = like.recipes;
      
      // Fetch categories
      const { data: categories } = await supabase
        .from('recipe_categories')
        .select(`
          categories!inner(
            id,
            name,
            slug
          )
        `)
        .eq('recipe_id', recipe.id);

      const summary: RecipeSummary = {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        summary: recipe.summary,
        cover_image_key: recipe.cover_image_key,
        like_count: recipe.like_count,
        is_public: recipe.is_public,
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        author: {
          id: (recipe.author as any).id,
          username: (recipe.author as any).username,
          display_name: (recipe.author as any).display_name,
          avatar_key: (recipe.author as any).avatar_key
        },
        categories: categories?.map(c => (c.categories as any)) || [],
        is_saved: false, // Would need another query
        is_liked: true
      };

      return summary;
    })
  );

  return { recipes, hasMore: likes?.length === limit };
}