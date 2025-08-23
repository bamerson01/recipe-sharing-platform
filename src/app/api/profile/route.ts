import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { UpdateProfileSchema, validateRequest, formatZodErrors } from "@/lib/validation/api-schemas";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }


    // Ensure profile exists (creates if missing)
    await ensureProfile();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        error: 'Profile not found'
      }, { status: 500 });
    }


    return NextResponse.json({ profile });

  } catch (error) {
    // Log error internally but don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching profile:', error);
    }
    return NextResponse.json({
      error: 'Internal server error'
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

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(UpdateProfileSchema, body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        errors: formatZodErrors(validation.errors)
      }, { status: 400 });
    }

    const { display_name, username, bio } = validation.data;

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating profile:', updateError);
      }
      return NextResponse.json({
        error: 'Failed to update profile'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating profile:', error);
    }
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
