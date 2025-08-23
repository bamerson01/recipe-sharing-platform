import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';
import { getFollowers, getFollowing, getRecentFromFollowing } from '@/app/_actions/manage-follows';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        userError: userError?.message 
      }, { status: 401 });
    }

    // Test all the functions that are failing
    const results = {
      userId: user.id,
      tests: {} as any
    };

    // Test getFollowers
    try {
      const followersResult = await getFollowers(user.id, 1, 5);
      results.tests.getFollowers = {
        success: followersResult.success,
        error: followersResult.error,
        followersCount: followersResult.followers?.length || 0,
        data: followersResult
      };
    } catch (error) {
      results.tests.getFollowers = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exception: true
      };
    }

    // Test getFollowing
    try {
      const followingResult = await getFollowing(user.id, 1, 5);
      results.tests.getFollowing = {
        success: followingResult.success,
        error: followingResult.error,
        followingCount: followingResult.following?.length || 0,
        data: followingResult
      };
    } catch (error) {
      results.tests.getFollowing = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exception: true
      };
    }

    // Test getRecentFromFollowing
    try {
      const recipesResult = await getRecentFromFollowing(1, 5);
      results.tests.getRecentFromFollowing = {
        success: recipesResult.success,
        error: recipesResult.error,
        recipesCount: recipesResult.recipes?.length || 0,
        data: recipesResult
      };
    } catch (error) {
      results.tests.getRecentFromFollowing = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exception: true
      };
    }

    // Test direct database queries
    try {
      // Check follows table directly
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
        .limit(10);

      results.tests.directFollowsQuery = {
        success: !followsError,
        error: followsError?.message,
        data: followsData
      };

      // Check profile counts
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('follower_count, following_count')
        .eq('id', user.id)
        .single();

      results.tests.profileCounts = {
        success: !profileError,
        error: profileError?.message,
        data: profileData
      };

    } catch (error) {
      results.tests.directQueries = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exception: true
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}