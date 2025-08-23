import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

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

    // Get profile with current counts
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('follower_count, following_count, username, display_name')
      .eq('id', user.id)
      .single();


    // Count actual followers
    const { count: actualFollowerCount, error: followerCountError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Count actual following
    const { count: actualFollowingCount, error: followingCountError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    // Get the actual follows data for debugging
    const { data: followsAsFollower, error: followsAsFollowerError } = await supabase
      .from('follows')
      .select(`
        id,
        following_id,
        created_at,
        following:profiles!follows_following_id_fkey(
          username,
          display_name
        )
      `)
      .eq('follower_id', user.id);

    const { data: followsAsFollowing, error: followsAsFollowingError } = await supabase
      .from('follows')
      .select(`
        id,
        follower_id,
        created_at,
        follower:profiles!follows_follower_id_fkey(
          username,
          display_name
        )
      `)
      .eq('following_id', user.id);

    return NextResponse.json({
      userId: user.id,
      profile: profileError ? null : {
        username: profile?.username,
        display_name: profile?.display_name,
        stored_follower_count: profile?.follower_count,
        stored_following_count: profile?.following_count,
      },
      actual_counts: {
        followers: actualFollowerCount ?? 0,
        following: actualFollowingCount ?? 0,
      },
      counts_match: profile ? {
        followers: profile.follower_count === (actualFollowerCount ?? 0),
        following: profile.following_count === (actualFollowingCount ?? 0),
      } : null,
      detailed_follows: {
        following: followsAsFollower?.map(f => ({
          id: f.id,
          following_user: f.following,
          created_at: f.created_at,
        })) || [],
        followers: followsAsFollowing?.map(f => ({
          id: f.id,
          follower_user: f.follower,
          created_at: f.created_at,
        })) || [],
      },
      errors: {
        profileError: profileError?.message || null,
        followerCountError: followerCountError?.message || null,
        followingCountError: followingCountError?.message || null,
        followsAsFollowerError: followsAsFollowerError?.message || null,
        followsAsFollowingError: followsAsFollowingError?.message || null,
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}