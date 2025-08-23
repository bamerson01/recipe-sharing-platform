import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's recipe count
    const { count: recipeCount, error: recipeError } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    if (recipeError) {      return NextResponse.json(
        { error: 'Failed to fetch recipe count' },
        { status: 500 }
      );
    }

    // Get user's saved count
    const { count: savedCountResult, error: savedError } = await supabase
      .from('saves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    let savedCount = savedCountResult || 0;
    if (savedError) {      // If saves table doesn't exist, return 0
      savedCount = 0;
    }

    // Get total likes across user's recipes
    const { data: recipes, error: likesError } = await supabase
      .from('recipes')
      .select('like_count')
      .eq('author_id', user.id);

    if (likesError) {      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      );
    }

    const totalLikes = recipes?.reduce((sum, r) => sum + (r.like_count || 0), 0) || 0;

    return NextResponse.json({
      recipeCount: recipeCount || 0,
      savedCount: savedCount || 0,
      totalLikes
    });

  } catch (error) {    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
