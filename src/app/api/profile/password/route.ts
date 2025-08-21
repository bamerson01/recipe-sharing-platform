import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

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
    const { current_password, new_password } = body;

    // Validate required fields
    if (!current_password || !new_password) {
      return NextResponse.json({
        error: 'Current password and new password are required'
      }, { status: 400 });
    }

    // Validate new password length
    if (new_password.length < 8) {
      return NextResponse.json({
        error: 'New password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Change password using Supabase Auth
    const { error: passwordError } = await supabase.auth.updateUser({
      password: new_password
    });

    if (passwordError) {
      console.error('Error changing password:', passwordError);

      // Handle specific password errors
      if (passwordError.message.includes('password')) {
        return NextResponse.json({
          error: 'Invalid current password'
        }, { status: 400 });
      }

      return NextResponse.json({
        error: 'Failed to change password',
        details: passwordError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
