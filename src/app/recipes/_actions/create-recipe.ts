'use server';

import { z } from 'zod';
import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { RecipeInput } from '@/lib/validation/recipe';
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify';

const CreateRecipeInput = RecipeInput.extend({
  imageFile: z.instanceof(File).nullable().optional(),
});

export async function createRecipe(formData: FormData) {
  try {
    // Parse form data
    const rawData = {
      title: formData.get('title'),
      summary: formData.get('summary') || undefined,
      isPublic: formData.get('isPublic') === 'on',
      ingredients: JSON.parse(formData.get('ingredients') as string),
      steps: JSON.parse(formData.get('steps') as string),
      categoryIds: JSON.parse(formData.get('categoryIds') as string),
      imageFile: formData.get('imageFile') as File | null,
    };

    const parsed = CreateRecipeInput.safeParse(rawData);
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

    // Check if profile exists, create if not
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: null,
          display_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { ok: false, message: 'Failed to create profile' } as const;
      }
    }

    // Generate unique slug
    const { data: existingSlugs } = await supabase
      .from('recipes')
      .select('slug')
      .eq('author_id', user.id);

    const slug = generateUniqueSlug(
      parsed.data.title,
      existingSlugs?.map(r => r.slug) || []
    );

    // Handle image upload if provided
    let imagePath: string | null = null;
    if (parsed.data.imageFile) {
      const imageBuffer = await parsed.data.imageFile.arrayBuffer();
      const imageKey = `recipes/${user.id}/covers/${Date.now()}-${parsed.data.imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('public-media')
        .upload(imageKey, imageBuffer, {
          contentType: parsed.data.imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        return { ok: false, message: 'Failed to upload image' } as const;
      }

      imagePath = imageKey;
    }

    // Create recipe with transaction-like approach
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        author_id: user.id,
        title: parsed.data.title,
        slug,
        summary: parsed.data.summary,
        cover_image_key: imagePath,
        is_public: parsed.data.isPublic,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      console.error('Recipe creation error:', recipeError);
      return { ok: false, message: 'Failed to create recipe' } as const;
    }

    // Insert ingredients
    if (parsed.data.ingredients.length > 0) {
      const ingredientsData = parsed.data.ingredients.map((ing, index) => ({
        recipe_id: recipe.id,
        position: index,
        text: ing.text.trim(),
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsData);

      if (ingredientsError) {
        console.error('Ingredients error:', ingredientsError);
        // Continue anyway, recipe was created
      }
    }

    // Insert steps
    if (parsed.data.steps.length > 0) {
      const stepsData = parsed.data.steps.map((step, index) => ({
        recipe_id: recipe.id,
        position: index,
        text: step.text.trim(),
      }));

      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(stepsData);

      if (stepsError) {
        console.error('Steps error:', stepsError);
        // Continue anyway, recipe was created
      }
    }

    // Insert category relationships
    if (parsed.data.categoryIds.length > 0) {
      const categoryData = parsed.data.categoryIds.map(categoryId => ({
        recipe_id: recipe.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('recipe_categories')
        .insert(categoryData);

      if (categoryError) {
        console.error('Category error:', categoryError);
        // Continue anyway, recipe was created
      }
    }

    // Revalidate relevant paths
    revalidatePath('/recipes/my');
    revalidatePath('/explore');

    return {
      ok: true,
      recipeId: recipe.id,
      slug: recipe.slug,
      message: 'Recipe created successfully!'
    } as const;

  } catch (error) {
    console.error('Unexpected error creating recipe:', error);
    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}
