import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('Profile fetched:', {
      id: profile.id,
      avatar_key: profile.avatar_key,
      display_name: profile.display_name
    });

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { display_name, username, bio } = body;

    // Validate required fields
    if (!display_name || !username) {
      return NextResponse.json({
        error: 'Display name and username are required'
      }, { status: 400 });
    }

    // Check if username is already taken by another user
    if (username) {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return NextResponse.json({
          error: 'Username is already taken'
        }, { status: 409 });
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name,
        username,
        bio: bio || null
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({
        error: 'Failed to update profile',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
