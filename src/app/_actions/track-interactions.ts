'use server';

import { getServerSupabase } from '@/lib/db/server';
import { z } from 'zod';

// Types for Supabase nested objects
interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
}

interface RecipeData {
  id: string;
  title: string;
  slug: string;
}

// Validation schemas
const getInteractionsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  recipeId: z.string().optional(),
});

// Get users who liked my recipes
export async function getWhoLikedMyRecipes(page: number = 1, limit: number = 20, recipeId?: string) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = getInteractionsSchema.safeParse({ page, limit, recipeId });
    if (!validated.success) {
      return { success: false, error: 'Invalid parameters' };
    }

    const { page: validatedPage, limit: validatedLimit, recipeId: validatedRecipeId } = validated.data;
    const offset = (validatedPage - 1) * validatedLimit;

    // First get the user's recipe IDs
    const { data: userRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id')
      .eq('author_id', user.id);

    if (recipesError) {      return { success: false, error: 'Failed to fetch user recipes' };
    }

    const recipeIds = userRecipes?.map(r => r.id) || [];
    if (recipeIds.length === 0) {
      return {
        success: true,
        likes: [],
        count: 0,
        page: validatedPage,
        limit: validatedLimit,
      };
    }

    // Build query using manual joins
    let query = supabase
      .from('likes')
      .select(`
        id,
        created_at,
        recipe_id,
        user_id
      `, { count: 'exact' })
      .in('recipe_id', recipeIds)
      .order('created_at', { ascending: false });

    // Filter by specific recipe if provided
    if (validatedRecipeId) {
      query = query.eq('recipe_id', validatedRecipeId);
    }

    const { data: likes, error: likesError, count } = await query.range(offset, offset + validatedLimit - 1);

    if (likesError) {      return { success: false, error: 'Failed to fetch likes' };
    }

    // Transform data - fetch profile and recipe data separately
    const transformedLikes = [];
    if (likes && likes.length > 0) {
      const userIds = likes.map(l => l.user_id);
      const recipeIds = likes.map(l => l.recipe_id);
      
      // Fetch profile data for all likers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_key')
        .in('id', userIds);
      
      if (profilesError) {        return { success: false, error: 'Failed to fetch liker profiles' };
      }
      
      // Fetch recipe data for all liked recipes
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('id, title, slug')
        .in('id', recipeIds);
      
      if (recipesError) {        return { success: false, error: 'Failed to fetch liked recipes' };
      }
      
      // Create maps for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const recipeMap = new Map(recipes?.map(r => [r.id, r]) || []);
      
      // Transform the data
      for (const like of likes) {
        const profile = profileMap.get(like.user_id);
        const recipe = recipeMap.get(like.recipe_id);
        
        if (profile && recipe) {
          transformedLikes.push({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_key: profile.avatar_key,
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            recipe_slug: recipe.slug,
            liked_at: like.created_at,
          });
        }
      }
    }

    return {
      success: true,
      likes: transformedLikes,
      count: count || 0,
      page: validatedPage,
      limit: validatedLimit,
    };

  } catch (error) {    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get users who commented on my recipes
export async function getWhoCommentedOnMyRecipes(page: number = 1, limit: number = 20, recipeId?: string) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = getInteractionsSchema.safeParse({ page, limit, recipeId });
    if (!validated.success) {
      return { success: false, error: 'Invalid parameters' };
    }

    const { page: validatedPage, limit: validatedLimit, recipeId: validatedRecipeId } = validated.data;
    const offset = (validatedPage - 1) * validatedLimit;

    // First get the user's recipe IDs
    const { data: userRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id')
      .eq('author_id', user.id);

    if (recipesError) {      return { success: false, error: 'Failed to fetch user recipes' };
    }

    const recipeIds = userRecipes?.map(r => r.id) || [];
    if (recipeIds.length === 0) {
      return {
        success: true,
        comments: [],
        count: 0,
        page: validatedPage,
        limit: validatedLimit,
      };
    }

    // Build query using manual joins
    let query = supabase
      .from('recipe_comments')
      .select(`
        id,
        body,
        created_at,
        recipe_id,
        user_id
      `, { count: 'exact' })
      .in('recipe_id', recipeIds)
      .order('created_at', { ascending: false });

    // Filter by specific recipe if provided
    if (validatedRecipeId) {
      query = query.eq('recipe_id', validatedRecipeId);
    }

    const { data: comments, error: commentsError, count } = await query.range(offset, offset + validatedLimit - 1);

    if (commentsError) {      return { success: false, error: 'Failed to fetch comments' };
    }

    // Transform data - fetch profile and recipe data separately
    const transformedComments = [];
    if (comments && comments.length > 0) {
      const userIds = comments.map(c => c.user_id);
      const recipeIds = comments.map(c => c.recipe_id);
      
      // Fetch profile data for all commenters
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_key')
        .in('id', userIds);
      
      if (profilesError) {        return { success: false, error: 'Failed to fetch commenter profiles' };
      }
      
      // Fetch recipe data for all commented recipes
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('id, title, slug')
        .in('id', recipeIds);
      
      if (recipesError) {        return { success: false, error: 'Failed to fetch commented recipes' };
      }
      
      // Create maps for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const recipeMap = new Map(recipes?.map(r => [r.id, r]) || []);
      
      // Transform the data
      for (const comment of comments) {
        const profile = profileMap.get(comment.user_id);
        const recipe = recipeMap.get(comment.recipe_id);
        
        if (profile && recipe) {
          transformedComments.push({
            id: comment.id,
            user_id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_key: profile.avatar_key,
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            recipe_slug: recipe.slug,
            comment_body: comment.body,
            comment_excerpt: comment.body.length > 100 ? `${comment.body.substring(0, 100)}...` : comment.body,
            commented_at: comment.created_at,
          });
        }
      }
    }

    return {
      success: true,
      comments: transformedComments,
      count: count || 0,
      page: validatedPage,
      limit: validatedLimit,
    };

  } catch (error) {    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get total likes across all my recipes
export async function getTotalLikesOnMyRecipes() {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Sum likes across all recipes by the user
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('like_count')
      .eq('author_id', user.id);

    if (recipesError) {      return { success: false, error: 'Failed to fetch recipe likes' };
    }

    const totalLikes = recipes?.reduce((sum, recipe) => sum + (recipe.like_count || 0), 0) || 0;

    return {
      success: true,
      totalLikes,
    };

  } catch (error) {    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get total comments across all my recipes
export async function getTotalCommentsOnMyRecipes() {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // First get the user's recipe IDs
    const { data: userRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id')
      .eq('author_id', user.id);

    if (recipesError) {      return { success: false, error: 'Failed to fetch user recipes' };
    }

    const recipeIds = userRecipes?.map(r => r.id) || [];
    if (recipeIds.length === 0) {
      return {
        success: true,
        totalComments: 0,
      };
    }

    // Count comments on recipes by the user
    const { count, error: commentsError } = await supabase
      .from('recipe_comments')
      .select('*', { count: 'exact', head: true })
      .in('recipe_id', recipeIds);

    if (commentsError) {      return { success: false, error: 'Failed to count comments' };
    }

    return {
      success: true,
      totalComments: count || 0,
    };

  } catch (error) {    return { success: false, error: 'An unexpected error occurred' };
  }
}
