import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update profile with email prefix
    const emailPrefix = user.email?.split('@')[0];
    const newDisplayName = emailPrefix || 'Anonymous';
    const newUsername = emailPrefix || null;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: newDisplayName,
        username: newUsername
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update profile',
        updateError: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      oldProfile: profile,
      newProfile: {
        ...profile,
        display_name: newDisplayName,
        username: newUsername
      }
    });

  } catch (error) {    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
