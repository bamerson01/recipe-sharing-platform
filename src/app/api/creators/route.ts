import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Get current user to check following status
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch all profiles with recipe and follower counts
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_key,
        bio
      `)
      .not('username', 'is', null) // Only show users who have set up their profile
      .order('created_at', { ascending: false });

    if (error) {      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    // For each profile, get their recipe count and follower count
    const creatorsWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get recipe count
        const { count: recipeCount } = await supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', profile.id)
          .eq('is_public', true);

        // Get follower count
        const { count: followerCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        // Check if current user follows this creator
        let isFollowing = false;
        if (user && user.id !== profile.id) {
          const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .single();
          
          isFollowing = !!follow;
        }

        return {
          ...profile,
          recipe_count: recipeCount || 0,
          follower_count: followerCount || 0,
          is_following: isFollowing
        };
      })
    );

    // Sort by recipe count (most recipes first)
    creatorsWithStats.sort((a, b) => b.recipe_count - a.recipe_count);

    return NextResponse.json({ 
      creators: creatorsWithStats,
      total: creatorsWithStats.length 
    });

  } catch (error) {    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}