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
    console.log('🚀 Avatar upload started');

    // Use SSR client for user authentication
    const ssr = getSSR();
    const { data: { user }, error: userError } = await ssr.auth.getUser();

    console.log('🔍 User auth check:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError?.message,
      errorCode: userError?.status
    });

    if (userError || !user) {
      console.log('❌ Authentication failed:', { userError, user: !!user });
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    const formData = await request.formData();
    console.log('📋 FormData keys:', Array.from(formData.keys()));

    const avatarFile = formData.get('avatar') as File;
    console.log('📁 File received:', {
      name: avatarFile?.name,
      size: avatarFile?.size,
      type: avatarFile?.type,
      exists: !!avatarFile
    });

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

    console.log('✅ File validation passed');

    // Generate storage key using new structure
    const ulid = generateULID();
    const ext = getFileExtension(avatarFile.name, avatarFile.type);
    const baseName = avatarFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const storageKey = buildAvatarKey(user.id, baseName, ulid, ext);

    console.log('🔑 Generated storage key:', storageKey);
    console.log('🪣 Using bucket:', BUCKET);

    // Use admin client for storage operations
    const admin = getAdmin();
    console.log('✅ Admin client created');

    // Upload to Supabase Storage with service role
    console.log('📤 Starting upload to Supabase Storage...');
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storageKey, avatarFile, {
        contentType: avatarFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading avatar:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    console.log('✅ File uploaded to storage successfully');

    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from(BUCKET)
      .getPublicUrl(storageKey);

    console.log('🔗 Generated public URL:', publicUrl);

    // Update profile with new avatar key using admin client
    console.log('💾 Updating profile with avatar_key:', storageKey);
    const { error: updateError } = await admin
      .from('profiles')
      .update({ avatar_key: storageKey })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('✅ Profile updated successfully');

    return NextResponse.json({
      success: true,
      avatar_key: storageKey,
      avatar_url: publicUrl
    });

  } catch (error) {
    console.error('💥 Unexpected error in avatar upload:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Avatar deletion started');

    // Use SSR client for user authentication
    const ssr = getSSR();
    const { data: { user }, error: userError } = await ssr.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('✅ User authenticated for deletion:', user.id);

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
        console.log('🗑️ Removing avatar from storage:', profile.avatar_key);

        // Use admin client for storage operations
        const admin = getAdmin();
        const { error: deleteError } = await admin.storage
          .from(BUCKET)
          .remove([profile.avatar_key]);

        if (deleteError) {
          console.error('❌ Error deleting avatar from storage:', deleteError);
        } else {
          console.log('✅ Avatar removed from storage successfully');
        }
      } catch (error) {
        console.error('❌ Error processing avatar key for deletion:', error);
      }
    }

    // Update profile to remove avatar key using admin client
    const admin = getAdmin();
    const { error: updateError } = await admin
      .from('profiles')
      .update({ avatar_key: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('✅ Profile updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('💥 Unexpected error in avatar deletion:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
