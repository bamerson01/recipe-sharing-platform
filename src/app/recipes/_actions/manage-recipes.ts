'use server';

import { z } from 'zod';
import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { RecipeInput } from '@/lib/validation/recipe';

const UpdateRecipeInput = RecipeInput.extend({
  id: z.number(),
  imageFile: z.any().optional(), // File validation doesn't work in server actions
});

export async function updateRecipe(formData: FormData) {
  try {
    // Parse form data
    const imageFile = formData.get('imageFile');
    const difficulty = formData.get('difficulty') as string;
    const prepTime = formData.get('prepTime') as string;
    const cookTime = formData.get('cookTime') as string;
    
    const rawData = {
      id: parseInt(formData.get('id') as string),
      title: formData.get('title'),
      summary: formData.get('summary') || undefined,
      isPublic: formData.get('isPublic') === 'on',
      difficulty: difficulty && difficulty !== '' ? difficulty : null,
      prepTime: prepTime && prepTime !== '' ? parseInt(prepTime) : null,
      cookTime: cookTime && cookTime !== '' ? parseInt(cookTime) : null,
      ingredients: JSON.parse(formData.get('ingredients') as string),
      steps: JSON.parse(formData.get('steps') as string),
      categoryIds: JSON.parse(formData.get('categoryIds') as string),
      imageFile: imageFile instanceof File ? imageFile : undefined,
    };

    const parsed = UpdateRecipeInput.safeParse(rawData);
    if (!parsed.success) {
      return {
        ok: false,
        errors: parsed.error.flatten()
      } as const;
    }

    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, message: 'Unauthorized' } as const;
    }

    // Verify recipe ownership
    const { data: existingRecipe, error: ownershipError } = await supabase
      .from('recipes')
      .select('id, author_id, cover_image_key')
      .eq('id', parsed.data.id)
      .single();

    if (ownershipError || !existingRecipe) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    if (existingRecipe.author_id !== user.id) {
      return { ok: false, message: 'Unauthorized' } as const;
    }

    // Handle image upload if provided
    let imagePath = existingRecipe.cover_image_key;
    if (parsed.data.imageFile && parsed.data.imageFile instanceof File) {      
      const imageBuffer = await parsed.data.imageFile.arrayBuffer();
      const imageKey = `recipes/${user.id}/covers/${Date.now()}-${parsed.data.imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-media')
        .upload(imageKey, imageBuffer, {
          contentType: parsed.data.imageFile.type,
          upsert: false,
        });

      if (uploadError) {        return { ok: false, message: `Failed to upload image: ${uploadError.message}` } as const;
      }
      // Delete old image if it exists
      if (existingRecipe.cover_image_key) {        const { error: deleteError } = await supabase.storage
          .from('public-media')
          .remove([existingRecipe.cover_image_key]);
        if (deleteError) {        }
      }

      imagePath = imageKey;    } else {    }

    // Update recipe
    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        title: parsed.data.title,
        summary: parsed.data.summary,
        cover_image_key: imagePath,
        is_public: parsed.data.isPublic,
        difficulty: parsed.data.difficulty,
        prep_time: parsed.data.prepTime,
        cook_time: parsed.data.cookTime,
      })
      .eq('id', parsed.data.id);

    if (recipeError) {      return { ok: false, message: 'Failed to update recipe' } as const;
    }

    // Delete existing ingredients, steps, and categories
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', parsed.data.id);
    await supabase.from('recipe_steps').delete().eq('recipe_id', parsed.data.id);
    await supabase.from('recipe_categories').delete().eq('recipe_id', parsed.data.id);

    // Insert new ingredients
    if (parsed.data.ingredients.length > 0) {
      const ingredientsData = parsed.data.ingredients.map((ing, index) => ({
        recipe_id: parsed.data.id,
        position: index,
        text: ing.text.trim(),
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsData);

      if (ingredientsError) {      }
    }

    // Insert new steps
    if (parsed.data.steps.length > 0) {
      const stepsData = parsed.data.steps.map((step, index) => ({
        recipe_id: parsed.data.id,
        position: index,
        text: step.text.trim(),
      }));

      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(stepsData);

      if (stepsError) {      }
    }

    // Insert new category relationships
    if (parsed.data.categoryIds && parsed.data.categoryIds.length > 0) {
      const categoryData = parsed.data.categoryIds.map(categoryId => ({
        recipe_id: parsed.data.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('recipe_categories')
        .insert(categoryData);

      if (categoryError) {      }
    }

    // Revalidate relevant paths
    revalidatePath('/recipes/my');
    revalidatePath('/explore');
    // Note: We don't have the slug here, but that's okay
    // The revalidation will happen when the recipe is viewed

    return {
      ok: true,
      message: 'Recipe updated successfully!'
    } as const;

  } catch (error) {    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function deleteRecipe(recipeId: number) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, message: 'Unauthorized' } as const;
    }

    // Verify recipe ownership
    const { data: recipe, error: ownershipError } = await supabase
      .from('recipes')
      .select('id, author_id, cover_image_key')
      .eq('id', recipeId)
      .single();

    if (ownershipError || !recipe) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    if (recipe.author_id !== user.id) {
      return { ok: false, message: 'Unauthorized' } as const;
    }

    // Delete recipe (cascades to ingredients, steps, categories, likes)
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (deleteError) {      return { ok: false, message: 'Failed to delete recipe' } as const;
    }

    // Delete image from storage if it exists
    if (recipe.cover_image_key) {
      await supabase.storage
        .from('public-media')
        .remove([recipe.cover_image_key]);
    }

    // Revalidate relevant paths
    revalidatePath('/recipes/my');
    revalidatePath('/explore');

    return {
      ok: true,
      message: 'Recipe deleted successfully!'
    } as const;

  } catch (error) {    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function toggleRecipeVisibility(recipeId: number) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, message: 'Unauthorized' } as const;
    }

    // Get current recipe state
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('id, author_id, is_public')
      .eq('id', recipeId)
      .single();

    if (fetchError || !recipe) {
      return { ok: false, message: 'Recipe not found' } as const;
    }

    if (recipe.author_id !== user.id) {
      return { ok: false, message: 'Unauthorized' } as const;
    }

    // Toggle visibility
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ is_public: !recipe.is_public })
      .eq('id', recipeId);

    if (updateError) {      return { ok: false, message: 'Failed to update recipe' } as const;
    }

    // Revalidate relevant paths
    revalidatePath('/recipes/my');
    revalidatePath('/explore');

    return {
      ok: true,
      isPublic: !recipe.is_public,
      message: `Recipe ${!recipe.is_public ? 'published' : 'made private'} successfully!`
    } as const;

  } catch (error) {    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}
