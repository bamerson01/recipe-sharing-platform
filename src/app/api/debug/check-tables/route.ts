import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    const results = {
      follows_table: null as any,
      user_follows_table: null as any,
      profile_counts: null as any,
      recommendations: null as any
    };

    // Check the 'follows' table
    const { data: followsData, error: followsError, count: followsCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .limit(5);
    
    results.follows_table = {
      success: !followsError,
      count: followsCount,
      sample: followsData,
      error: followsError?.message || null,
      columns: followsData && followsData.length > 0 ? Object.keys(followsData[0]) : []
    };

    // Check the 'user_follows' table
    const { data: userFollowsData, error: userFollowsError, count: userFollowsCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact' })
      .limit(5);
    
    results.user_follows_table = {
      success: !userFollowsError,
      count: userFollowsCount,
      sample: userFollowsData,
      error: userFollowsError?.message || null,
      columns: userFollowsData && userFollowsData.length > 0 ? Object.keys(userFollowsData[0]) : []
    };

    // Check which table the profile counts are referencing
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('follower_count, following_count')
        .eq('id', user.id)
        .single();
      
      // Count in follows table
      const { count: followsFollowerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', user.id);
        
      const { count: followsFollowingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      
      // Count in user_follows table
      const { count: userFollowsFollowerCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follows_user_id', user.id);
        
      const { count: userFollowsFollowingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      results.profile_counts = {
        profile_stored: profile,
        follows_table_counts: {
          followers: followsFollowerCount,
          following: followsFollowingCount
        },
        user_follows_table_counts: {
          followers: userFollowsFollowerCount,
          following: userFollowsFollowingCount
        }
      };
    }

    // Determine which table to use
    results.recommendations = {
      active_table: userFollowsCount > 0 ? 'user_follows' : 'follows',
      reason: userFollowsCount > 0 
        ? 'user_follows table has data' 
        : 'follows table has data or both are empty'
    };

    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}