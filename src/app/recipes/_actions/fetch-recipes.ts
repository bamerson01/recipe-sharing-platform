'use server';

import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';

// Raw types from Supabase queries
interface RawRecipe {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: Array<{
    id: string;
    display_name: string | null;
    username: string | null;
  }>;
}

interface RawCategory {
  category_id: number;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export interface RecipeWithDetails {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  is_public: boolean;
  like_count: number;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  prep_time: number | null;
  cook_time: number | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_key?: string | null;
  };
  ingredients: Array<{
    id: number;
    position: number;
    text: string;
  }>;
  steps: Array<{
    id: number;
    position: number;
    text: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  save_count?: number;
  comment_count?: number;
  isLiked?: boolean;
}

export async function fetchUserRecipes(userId: string) {
  try {
    const supabase = await getServerSupabase();

    // Fetch recipes with author info and counts
    const { data: recipes, error: recipesError } = await supabase
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
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return { ok: false, message: 'Failed to fetch recipes' } as const;
    }

    // Fetch ingredients, steps, categories, and counts for each recipe
    const recipesWithDetails: RecipeWithDetails[] = [];

    for (const recipe of recipes || []) {
      // Fetch ingredients
      const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select('id, position, text')
        .eq('recipe_id', recipe.id)
        .order('position');

      // Fetch steps
      const { data: steps } = await supabase
        .from('recipe_steps')
        .select('id, position, text')
        .eq('recipe_id', recipe.id)
        .order('position');

      // Fetch categories
      const { data: categories } = await supabase
        .from('recipe_categories')
        .select(`
          category_id,
          categories!inner(
            id,
            name,
            slug
          )
        `)
        .eq('recipe_id', recipe.id);

      // Fetch saves count
      const { count: savesCount } = await supabase
        .from('saves')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipe.id);

      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('recipe_comments')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipe.id);

      recipesWithDetails.push({
        ...recipe,
        author: recipe.author[0], // Take first (and only) author from array
        ingredients: ingredients || [],
        steps: steps || [],
        categories: categories?.map(c => c.categories[0]) || [], // Take first category from each
        save_count: savesCount || 0,
        comment_count: commentsCount || 0,
      });
    }

    return { ok: true, recipes: recipesWithDetails } as const;

  } catch (error) {
    console.error('Unexpected error fetching recipes:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function fetchRecipeBySlug(slug: string, userId?: string) {
  try {
    const supabase = await getServerSupabase();

    // Fetch recipe with author info
    const { data: recipe, error: recipeError } = await supabase
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
        author_id,
        author:profiles!inner(
          id,
          display_name,
          username,
          avatar_key
        )
      `)
      .eq('slug', slug)
      .single();

    if (recipeError || !recipe) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    // Check if user can access this recipe
    if (!recipe.is_public && recipe.author_id !== userId) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    // Fetch ingredients
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('id, position, text')
      .eq('recipe_id', recipe.id)
      .order('position');

    // Fetch steps
    const { data: steps } = await supabase
      .from('recipe_steps')
      .select('id, position, text')
      .eq('recipe_id', recipe.id)
      .order('position');

    // Fetch categories
    const { data: categories } = await supabase
      .from('recipe_categories')
      .select(`
        category_id,
        categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('recipe_id', recipe.id);

    // Check if current user has liked this recipe
    let isLiked = false;
    if (userId) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', recipe.id)
        .eq('user_id', userId)
        .single();

      isLiked = !!like;
    }

    const recipeWithDetails: RecipeWithDetails & { isLiked: boolean } = {
      ...recipe,
      difficulty: recipe.difficulty || null,
      prep_time: recipe.prep_time || null,
      cook_time: recipe.cook_time || null,
      author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
      ingredients: ingredients || [],
      steps: steps || [],
      categories: categories?.map(c => Array.isArray(c.categories) ? c.categories[0] : c.categories) || [],
      isLiked,
    };

    return { ok: true, recipe: recipeWithDetails } as const;

  } catch (error) {
    console.error('Unexpected error fetching recipe:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function fetchPublicRecipes(limit = 20, offset = 0, userId?: string) {
  try {
    const supabase = await getServerSupabase();

    // Fetch public recipes with author info
    const { data: recipes, error: recipesError } = await supabase
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
      `)
      .eq('is_public', true)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (recipesError) {
      console.error('Error fetching public recipes:', recipesError);
      return { ok: false, message: 'Failed to fetch recipes' } as const;
    }

    // Fetch ingredients, steps, and categories for each recipe
    const recipesWithDetails = await Promise.all(
      (recipes || []).map(async (recipe) => {
        // Fetch ingredients
        const { data: ingredients } = await supabase
          .from('recipe_ingredients')
          .select('id, position, text')
          .eq('recipe_id', recipe.id)
          .order('position');

        // Fetch steps
        const { data: steps } = await supabase
          .from('recipe_steps')
          .select('id, position, text')
          .eq('recipe_id', recipe.id)
          .order('position');

        // Fetch categories
        const { data: categories } = await supabase
          .from('recipe_categories')
          .select(`
            category_id,
            categories!inner(
              id,
              name,
              slug
            )
          `)
          .eq('recipe_id', recipe.id);

        // Check if current user has liked this recipe
        let isLiked = false;
        if (userId) {
          const { data: like } = await supabase
            .from('likes')
            .select('id')
            .eq('recipe_id', recipe.id)
            .eq('user_id', userId)
            .single();
          isLiked = !!like;
        }

        return {
          ...recipe,
          author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
          ingredients: ingredients || [],
          steps: steps || [],
          categories: categories?.map(c => Array.isArray(c.categories) ? c.categories[0] : c.categories) || [],
          isLiked,
        };
      })
    );

    return { ok: true, recipes: recipesWithDetails } as const;

  } catch (error) {
    console.error('Unexpected error fetching public recipes:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function fetchRecipeById(recipeId: number, userId?: string) {
  try {
    const supabase = await getServerSupabase();

    // Fetch recipe with author info
    const { data: recipe, error: recipeError } = await supabase
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
        author_id,
        author:profiles!inner(
          id,
          display_name,
          username,
          avatar_key
        )
      `)
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    // Check if user can access this recipe
    if (!recipe.is_public && recipe.author_id !== userId) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    // Fetch ingredients
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('id, position, text')
      .eq('recipe_id', recipe.id)
      .order('position');

    // Fetch steps
    const { data: steps } = await supabase
      .from('recipe_steps')
      .select('id, position, text')
      .eq('recipe_id', recipe.id)
      .order('position');

    // Fetch categories
    const { data: categories } = await supabase
      .from('recipe_categories')
      .select(`
        category_id,
        categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('recipe_id', recipe.id);

    // Check if current user has liked this recipe
    let isLiked = false;
    if (userId) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', recipe.id)
        .eq('user_id', userId)
        .single();

      isLiked = !!like;
    }

    const recipeWithDetails: RecipeWithDetails & { isLiked: boolean } = {
      ...recipe,
      difficulty: recipe.difficulty || null,
      prep_time: recipe.prep_time || null,
      cook_time: recipe.cook_time || null,
      author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
      ingredients: ingredients || [],
      steps: steps || [],
      categories: categories?.map(c => Array.isArray(c.categories) ? c.categories[0] : c.categories) || [],
      isLiked,
    };

    return { ok: true, recipe: recipeWithDetails } as const;

  } catch (error) {
    console.error('Unexpected error fetching recipe by ID:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function fetchUserProfile(usernameOrId: string) {
  try {
    const supabase = await getServerSupabase();

    // Try to find by username first, then by ID
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_key, created_at')
      .eq('username', usernameOrId)
      .single();

    if (error) {
      // If username not found, try by ID
      const { data: profileById, error: idError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_key, created_at')
        .eq('id', usernameOrId)
        .single();

      if (idError) {
        return { ok: false, message: 'User not found' } as const;
      }
      profile = profileById;
    }

    return { ok: true, profile } as const;

  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function fetchUserLikedRecipes(userId: string) {
  try {
    const supabase = await getServerSupabase();

    // Fetch recipes that the user has liked
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select(`
        recipe_id,
        recipes!inner(
          id,
          title,
          slug,
          summary,
          cover_image_key,
          is_public,
          like_count,
          created_at,
          author_id,
          author:profiles!inner(
            id,
            display_name,
            username
          )
        )
      `)
      .eq('user_id', userId)
      .eq('recipes.is_public', true); // Only public recipes

    if (likesError) {
      console.error('Error fetching user likes:', likesError);
      return { ok: false, message: 'Failed to fetch liked recipes' } as const;
    }

    // Fetch categories, ingredients, and steps for each liked recipe
    const recipesWithDetails = await Promise.all(
      (likes || []).map(async (like) => {
        const recipeData = (like as any).recipes;
        
        // Fetch categories
        const { data: categories } = await supabase
          .from('recipe_categories')
          .select(`
            category_id,
            categories!inner(
              id,
              name,
              slug
            )
          `)
          .eq('recipe_id', recipeData.id);
        
        // Fetch ingredients
        const { data: ingredients } = await supabase
          .from('recipe_ingredients')
          .select('id, position, text')
          .eq('recipe_id', recipeData.id)
          .order('position');
        
        // Fetch steps
        const { data: steps } = await supabase
          .from('recipe_steps')
          .select('id, position, text')
          .eq('recipe_id', recipeData.id)
          .order('position');

        return {
          ...recipeData,
          author: Array.isArray(recipeData.author) ? recipeData.author[0] : recipeData.author,
          categories: categories?.map(c => Array.isArray(c.categories) ? c.categories[0] : c.categories) || [],
          ingredients: ingredients || [],
          steps: steps || [],
        };
      })
    );

    return { ok: true, recipes: recipesWithDetails } as const;

  } catch (error) {
    console.error('Unexpected error fetching user liked recipes:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}
