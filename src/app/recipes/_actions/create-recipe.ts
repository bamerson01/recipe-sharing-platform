'use server';

import { z } from 'zod';
import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { CreateRecipeSchema } from '@/lib/validation/api-schemas';
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify';

const CreateRecipeInput = CreateRecipeSchema.extend({
  imageFile: z.any().optional(), // File validation doesn't work in server actions
});

export async function createRecipe(formData: FormData) {
  try {
    // Parse form data
    const imageFile = formData.get('imageFile');
    const rawData = {
      title: formData.get('title'),
      summary: formData.get('summary') || undefined,
      is_public: formData.get('isPublic') === 'on',
      difficulty: formData.get('difficulty') as 'easy' | 'medium' | 'hard' | null,
      prep_time: formData.get('prepTime') ? parseInt(formData.get('prepTime') as string, 10) : undefined,
      cook_time: formData.get('cookTime') ? parseInt(formData.get('cookTime') as string, 10) : undefined,
      ingredients: JSON.parse(formData.get('ingredients') as string),
      steps: JSON.parse(formData.get('steps') as string),
      category_ids: JSON.parse(formData.get('categoryIds') as string),
      imageFile: imageFile instanceof File ? imageFile : null,
    };
    
    console.log('📥 Raw FormData analysis:');
    console.log('  imageFile from FormData:', imageFile);
    console.log('  imageFile type:', typeof imageFile);
    console.log('  imageFile is File?:', imageFile instanceof File);
    if (imageFile instanceof File) {
      console.log('  File details:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });
    }
    console.log('📥 Raw data created:', {
      ...rawData,
      imageFile: rawData.imageFile ? 'File object' : null
    });

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
    if (parsed.data.imageFile && parsed.data.imageFile instanceof File) {
      console.log('🖼️ Processing image upload...');
      console.log('  File name:', parsed.data.imageFile.name);
      console.log('  File size:', parsed.data.imageFile.size);
      console.log('  File type:', parsed.data.imageFile.type);
      
      const imageBuffer = await parsed.data.imageFile.arrayBuffer();
      const imageKey = `recipes/${user.id}/covers/${Date.now()}-${parsed.data.imageFile.name}`;
      console.log('  Storage key:', imageKey);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-media')
        .upload(imageKey, imageBuffer, {
          contentType: parsed.data.imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        console.error('  Error details:', {
          message: uploadError.message,
          status: (uploadError as any).status,
          statusCode: (uploadError as any).statusCode
        });
        return { ok: false, message: `Failed to upload image: ${uploadError.message}` } as const;
      }
      
      console.log('✅ Image uploaded successfully:', uploadData);
      imagePath = imageKey;
      console.log('  Image path set to:', imagePath);
    } else {
      console.log('ℹ️ No image file provided');
    }

    // Create recipe with transaction-like approach
    console.log('📝 Creating recipe with data:', {
      author_id: user.id,
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      cover_image_key: imagePath,
      is_public: parsed.data.is_public,
      difficulty: parsed.data.difficulty,
      prep_time: parsed.data.prep_time,
      cook_time: parsed.data.cook_time,
    });
    
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        author_id: user.id,
        title: parsed.data.title,
        slug,
        summary: parsed.data.summary,
        cover_image_key: imagePath,
        is_public: parsed.data.is_public,
        difficulty: parsed.data.difficulty || null,
        prep_time: parsed.data.prep_time || null,
        cook_time: parsed.data.cook_time || null,
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
        text: typeof ing === 'string' ? ing.trim() : ing.text.trim(),
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
        text: typeof step === 'string' ? step.trim() : step.text.trim(),
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
    if (parsed.data.category_ids && parsed.data.category_ids.length > 0) {
      const categoryData = parsed.data.category_ids.map(categoryId => ({
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
