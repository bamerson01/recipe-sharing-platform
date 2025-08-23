import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

interface Params {
  params: Promise<{ username: string }>;
}

// GET /api/users/[username]/follow - Check if current user follows this user
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { username } = await params;
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ isFollowing: false });
    }

    // Get target user profile
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if following
    const { data: follow, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetProfile.id)
      .single();

    return NextResponse.json({ 
      isFollowing: !!follow && !error,
      followId: follow?.id 
    });

  } catch (error) {    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/users/[username]/follow - Follow a user
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { username } = await params;
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target user profile
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow self-follow
    if (targetProfile.id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetProfile.id)
      .single();

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create follow relationship
    const { data: newFollow, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetProfile.id
      })
      .select()
      .single();

    if (insertError) {      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      follow: newFollow,
      message: `You are now following ${targetProfile.display_name || targetProfile.username}`
    }, { status: 201 });

  } catch (error) {    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/users/[username]/follow - Unfollow a user
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { username } = await params;
    const supabase = await getServerSupabase();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target user profile
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete follow relationship
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetProfile.id);

    if (deleteError) {      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `You have unfollowed ${targetProfile.display_name || targetProfile.username}`
    });

  } catch (error) {    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}