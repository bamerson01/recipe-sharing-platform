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

    // Get following with their profile info
    const { data: following, error, count } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        following:profiles!follows_following_id_fkey(
          id,
          username,
          display_name,
          avatar_key,
          bio
        )
      `, { count: 'exact' })
      .eq('follower_id', targetProfile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching following:', error);
      return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
    }

    // Get current user to check if they follow these users
    const { data: { user } } = await supabase.auth.getUser();
    let followingStatus: Record<string, boolean> = {};

    if (user && following && following.length > 0) {
      const followingIds = following.map(f => (f.following as any).id);
      const { data: userFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', followingIds);

      const followingSet = new Set(userFollows?.map(f => f.following_id) || []);
      followingIds.forEach(id => {
        followingStatus[id] = followingSet.has(id);
      });
    }

    // Transform the data
    const transformedFollowing = following?.map(f => ({
      id: f.id,
      created_at: f.created_at,
      user: {
        ...(f.following as any),
        isFollowing: followingStatus[(f.following as any).id] || false,
        isCurrentUser: user?.id === (f.following as any).id
      }
    })) || [];

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

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}