import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if display_name is null and fix it
    if (!profile.display_name) {
      const emailPrefix = user.email?.split('@')[0];
      const newDisplayName = emailPrefix || 'Anonymous';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: newDisplayName,
          username: profile.username || emailPrefix
        })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({
          error: 'Failed to update profile',
          updateError: updateError.message
        });
      }

      return NextResponse.json({
        message: 'Profile updated successfully',
        oldDisplayName: profile.display_name,
        newDisplayName,
        oldUsername: profile.username,
        newUsername: profile.username || emailPrefix
      });
    }

    return NextResponse.json({
      message: 'Profile already has display name',
      profile
    });

  } catch (error) {    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
