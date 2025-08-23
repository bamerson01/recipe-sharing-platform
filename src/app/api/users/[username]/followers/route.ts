import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

interface Params {
  params: Promise<{ username: string }>;
}

// GET /api/users/[username]/followers - Get followers of a user
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
      .select('id, username, display_name, follower_count')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get followers
    const { data: followers, error, count } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        follower_id
      `, { count: 'exact' })
      .eq('followed_id', targetProfile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {      return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
    }

    // Get profile data for followers
    let transformedFollowers: any[] = [];
    
    if (followers && followers.length > 0) {
      const followerIds = followers.map(f => f.follower_id);
      
      // Fetch profile data for all followers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_key, bio')
        .in('id', followerIds);
      
      // Get current user to check if they follow these users
      const { data: { user } } = await supabase.auth.getUser();
      const followingStatus: Record<string, boolean> = {};

      if (user && profiles && profiles.length > 0) {
        const { data: userFollows } = await supabase
          .from('follows')
          .select('followed_id')
          .eq('follower_id', user.id)
          .in('followed_id', followerIds);

        const followingSet = new Set(userFollows?.map(f => f.followed_id) || []);
        followerIds.forEach(id => {
          followingStatus[id] = followingSet.has(id);
        });
      }

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Transform the data
      transformedFollowers = followers.map(f => {
        const profile = profileMap.get(f.follower_id);
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
        follower_count: targetProfile.follower_count
      },
      followers: transformedFollowers,
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