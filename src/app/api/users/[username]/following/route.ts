import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

interface Params {
  params: Promise<{ username: string }>;
}

// GET /api/users/[username]/following - Get users that a user follows
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = await getServerSupabase();

    // Get target user profile
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, following_count')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get following
    const { data: following, error, count } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        followed_id
      `, { count: 'exact' })
      .eq('follower_id', targetProfile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {      return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
    }

    // Get profile data for followed users
    let transformedFollowing: any[] = [];
    
    if (following && following.length > 0) {
      const followingIds = following.map(f => f.followed_id);
      
      // Fetch profile data for all followed users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_key, bio')
        .in('id', followingIds);
      
      // Get current user to check if they follow these users
      const { data: { user } } = await supabase.auth.getUser();
      const followingStatus: Record<string, boolean> = {};

      if (user && profiles && profiles.length > 0) {
        const { data: userFollows } = await supabase
          .from('follows')
          .select('followed_id')
          .eq('follower_id', user.id)
          .in('followed_id', followingIds);

        const followingSet = new Set(userFollows?.map(f => f.followed_id) || []);
        followingIds.forEach(id => {
          followingStatus[id] = followingSet.has(id);
        });
      }

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Transform the data
      transformedFollowing = following.map(f => {
        const profile = profileMap.get(f.followed_id);
        return {
          id: f.id,
          created_at: f.created_at,
          user: profile ? {
            ...profile,
            isFollowing: followingStatus[profile.id] || false,
            isCurrentUser: user?.id === profile.id
          } : null
        };
      }).filter(f => f.user !== null);
    }

    return NextResponse.json({
      user: {
        id: targetProfile.id,
        username: targetProfile.username,
        display_name: targetProfile.display_name,
        following_count: targetProfile.following_count
      },
      following: transformedFollowing,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}