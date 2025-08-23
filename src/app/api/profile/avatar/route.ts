import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { BUCKET, buildAvatarKey, generateULID, getFileExtension } from "@/lib/storage";

// Force Node runtime (needed for file uploads with supabase-js)
export const runtime = 'nodejs';

function getSSR() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookies().then(c => c.get(n)?.value) } }
  );
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  // No session persistence when using service role
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    // Use SSR client for user authentication
    const ssr = getSSR();
    const { data: { user }, error: userError } = await ssr.auth.getUser();
    if (userError || !user) {      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const formData = await request.formData();
    const avatarFile = formData.get('avatar') as File;
    if (!avatarFile || avatarFile.size === 0) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }

    // Validate file type
    if (!avatarFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }
    // Generate storage key using new structure
    const ulid = generateULID();
    const ext = getFileExtension(avatarFile.name, avatarFile.type);
    const baseName = avatarFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const storageKey = buildAvatarKey(user.id, baseName, ulid, ext);
    // Use admin client for storage operations
    const admin = getAdmin();
    // Upload to Supabase Storage with service role
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storageKey, avatarFile, {
        contentType: avatarFile.type,
        upsert: false
      });

    if (uploadError) {      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from(BUCKET)
      .getPublicUrl(storageKey);
    // Update profile with new avatar key using admin client
    const { error: updateError } = await admin
      .from('profiles')
      .update({ avatar_key: storageKey })
      .eq('id', user.id);

    if (updateError) {      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      avatar_key: storageKey,
      avatar_url: publicUrl
    });

  } catch (error) {    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use SSR client for user authentication
    const ssr = getSSR();
    const { data: { user }, error: userError } = await ssr.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Get current avatar key to remove from storage
    const { data: profile, error: profileError } = await ssr
      .from('profiles')
      .select('avatar_key')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Remove avatar from storage if it exists
    if (profile.avatar_key) {
      try {
        // Use admin client for storage operations
        const admin = getAdmin();
        const { error: deleteError } = await admin.storage
          .from(BUCKET)
          .remove([profile.avatar_key]);

        if (deleteError) {        } else {        }
      } catch (error) {      }
    }

    // Update profile to remove avatar key using admin client
    const admin = getAdmin();
    const { error: updateError } = await admin
      .from('profiles')
      .update({ avatar_key: null })
      .eq('id', user.id);

    if (updateError) {      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    });

  } catch (error) {    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
