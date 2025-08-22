import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(request: Request) {
  try {
    const supabase = await getServerSupabase();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First get the list of users the current user follows
    const { data: following, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followError) {
      console.error('Error fetching follows:', followError);
      return NextResponse.json(
        { error: 'Failed to fetch follows' },
        { status: 500 }
      );
    }

    // If not following anyone, return empty array
    if (!following || following.length === 0) {
      return NextResponse.json({ 
        recipes: [],
        count: 0 
      });
    }

    const followingIds = following.map(f => f.following_id);

    // Get recipes from users the current user follows
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
      .in('author_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching following feed:', error);
      return NextResponse.json(
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
  } catch (error) {
    console.error('Error in following feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}