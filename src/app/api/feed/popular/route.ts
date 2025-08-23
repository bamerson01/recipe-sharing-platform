import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(request: Request) {
  try {
    const supabase = await getServerSupabase();

    // Get popular recipes (sorted by like_count)
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        like_count,
        is_public,
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
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {      return NextResponse.json(
        { error: 'Failed to fetch feed' },
        { status: 500 }
      );
    }

    // Transform the data
    const formattedRecipes = recipes?.map(recipe => {
      // Handle author data
      const author = Array.isArray(recipe.author) ? recipe.author[0] : recipe.author;
      
      // Handle categories
      const categories = recipe.categories?.map((rc: any) => ({
        id: rc.category.id,
        name: rc.category.name,
        slug: rc.category.slug
      })) || [];

      return {
        ...recipe,
        author: author || null,
        categories
      };
    }) || [];

    return NextResponse.json({ 
      recipes: formattedRecipes,
      count: formattedRecipes.length 
    });
  } catch (error) {    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}