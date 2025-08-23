import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(request: Request) {
  try {
    const supabase = await getServerSupabase();
    
    // For testing, get a test user ID from URL params
    const { searchParams } = new URL(request.url);
    const testUserId = searchParams.get('userId');
    
    if (!testUserId) {
      return NextResponse.json({ 
        error: 'Test endpoint requires userId parameter',
        usage: 'Add ?userId=your-user-id to the URL'
      }, { status: 400 });
    }
    
    const user = { id: testUserId };

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check follows table
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
      .limit(10);

    // Check if user is following anyone
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    // Check if user has any followers
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', user.id);

    // Test getting recipes from followed users (if any)
    let recipesFromFollowing = null;
    let recipesError = null;
    
    if (following && following.length > 0) {
      const followedIds = following.map(f => f.following_id);
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          author_id,
          is_public,
          created_at
        `)
        .eq('is_public', true)
        .in('author_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(5);
        
      recipesFromFollowing = recipes;
      recipesError = error?.message;
    }

    return NextResponse.json({
      user: {
        id: user.id,
      },
      profile: profileError ? null : profile,
      socialData: {
        followers: followers?.length || 0,
        following: following?.length || 0,
        allFollows: follows?.length || 0,
      },
      recipesFromFollowing,
      errors: {
        profileError: profileError?.message || null,
        followsError: followsError?.message || null,
        followingError: followingError?.message || null,
        followersError: followersError?.message || null,
        recipesError,
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}