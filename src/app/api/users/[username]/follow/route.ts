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
      .eq('followed_id', targetProfile.id)
      .single();

    return NextResponse.json({ 
      isFollowing: !!follow && !error,
      followId: follow?.id 
    });

  } catch (error) {
    console.error('Unexpected error in follow POST:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
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
      .eq('followed_id', targetProfile.id)
      .single();

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create follow relationship
    console.log('Attempting to create follow:', {
      follower_id: user.id,
      followed_id: targetProfile.id
    });
    
    const { data: newFollow, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        followed_id: targetProfile.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Follow insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to follow user',
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      follow: newFollow,
      message: `You are now following ${targetProfile.display_name || targetProfile.username}`
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in follow POST:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
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
    console.log('Attempting to delete follow:', {
      follower_id: user.id,
      followed_id: targetProfile.id
    });
    
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followed_id', targetProfile.id);

    if (deleteError) {
      console.error('Unfollow delete error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to unfollow user',
        details: deleteError.message,
        code: deleteError.code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `You have unfollowed ${targetProfile.display_name || targetProfile.username}`
    });

  } catch (error) {
    console.error('Unexpected error in follow POST:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}