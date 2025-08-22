import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';
import type { RecipeFull } from '@/types/recipe';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const supabase = await getServerSupabase();
    
    // Get current user (optional)
    const { data: { user } } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if user can access this recipe
    if (!recipe.is_public && recipe.author_id !== user?.id) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
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

    // Check if current user has liked/saved this recipe
    let is_liked = false;
    let is_saved = false;
    
    if (user) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', recipe.id)
        .eq('user_id', user.id)
        .single();
      
      const { data: save } = await supabase
        .from('saves')
        .select('id')
        .eq('recipe_id', recipe.id)
        .eq('user_id', user.id)
        .single();
      
      is_liked = !!like;
      is_saved = !!save;
    }

    const recipeFull: RecipeFull = {
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
      ingredients: ingredients || [],
      steps: steps || [],
      is_liked,
      is_saved
    };

    return NextResponse.json(recipeFull);

  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}