import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recipe count
    const { count: recipeCount } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    // Get saved recipes count
    const { count: savedCount } = await supabase
      .from('saves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get total likes on user's recipes
    const { data: recipeLikes } = await supabase
      .from('recipes')
      .select('like_count')
      .eq('author_id', user.id);
    
    const totalLikes = recipeLikes?.reduce((sum, recipe) => sum + (recipe.like_count || 0), 0) || 0;

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', user.id);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    return NextResponse.json({
      recipes: recipeCount || 0,
      saved: savedCount || 0,
      likes: totalLikes,
      followers: followerCount || 0,
      following: followingCount || 0
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}