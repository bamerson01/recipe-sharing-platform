'use server';

import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';

export async function toggleSave(recipeId: number) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user already saved this recipe
    const { data: existingSave, error: saveCheckError } = await supabase
      .from('saves')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (saveCheckError && saveCheckError.code !== 'PGRST116') {
      console.error('Error checking save status:', saveCheckError);
      return { success: false, error: `Error checking save status: ${saveCheckError.message}` };
    }

    if (existingSave) {
      // Unsave: Remove the save
      const { error: deleteError } = await supabase
        .from('saves')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error removing save:', deleteError);
        return { success: false, error: 'Failed to remove save' };
      }

      // Revalidate relevant paths
      revalidatePath('/saved');
      revalidatePath('/dashboard');
      revalidatePath(`/r/${recipeId}`);

      return {
        success: true,
        saved: false,
        message: 'Recipe unsaved successfully'
      };
    } else {
      // Save: Add the save
      const { error: insertError } = await supabase
        .from('saves')
        .insert({
          recipe_id: recipeId,
          user_id: user.id,
        });

      if (insertError) {
        console.error('Error adding save:', insertError);
        return { success: false, error: 'Failed to add save' };
      }

      // Revalidate relevant paths
      revalidatePath('/saved');
      revalidatePath('/dashboard');
      revalidatePath(`/r/${recipeId}`);

      return {
        success: true,
        saved: true,
        message: 'Recipe saved successfully'
      };
    }

  } catch (error) {
    console.error('Unexpected error in save toggle:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getUserSavedRecipes(userId: string, limit = 20, offset = 0) {
  try {
    const supabase = await getServerSupabase();

    // Fetch saved recipes with recipe details
    const { data: saves, error: savesError } = await supabase
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

    if (savesError) {
      console.error('Error fetching saved recipes:', savesError);
      return { success: false, error: 'Failed to fetch saved recipes' };
    }

    // Fetch additional details for each recipe
    const recipesWithDetails = await Promise.all(
      (saves || []).map(async (save: any) => {
        const recipe = Array.isArray(save.recipe) ? save.recipe[0] : save.recipe;

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

        return {
          ...recipe,
          author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
          savedAt: save.created_at,
          ingredients: ingredients || [],
          steps: steps || [],
          categories: categories?.map((c: any) => Array.isArray(c.categories) ? c.categories[0] : c.categories) || [],
        };
      })
    );

    return { success: true, recipes: recipesWithDetails };

  } catch (error) {
    console.error('Unexpected error fetching saved recipes:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
