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

    // List all files in the public-media bucket
    const { data: files, error: listError } = await supabase.storage
      .from('public-media')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      return NextResponse.json({
        error: 'Failed to list storage files',
        details: listError.message
      }, { status: 500 });
    }

    // Get user's profile to see current avatar_key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_key')
      .eq('id', user.id)
      .single();

    // List files in avatars subfolder specifically
    const { data: avatarFiles, error: avatarListError } = await supabase.storage
      .from('public-media')
      .list('avatars', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    return NextResponse.json({
      success: true,
      user_id: user.id,
      current_avatar_key: profile?.avatar_key || null,
      all_files: files || [],
      avatar_files: avatarFiles || [],
      bucket_name: 'public-media'
    });

  } catch (error) {
    console.error('Error checking storage:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
