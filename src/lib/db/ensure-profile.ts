// Server-only helper to ensure a profile exists for the current user
import { getServerSupabase } from '@/lib/db/server';

export async function ensureProfile() {
  try {
    const sb = await getServerSupabase();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      console.log('ensureProfile: No authenticated user');
      return;
    }

    // If row exists, bail early
    const { data: existing } = await sb
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      console.log('ensureProfile: Profile already exists for user:', user.id);
      return;
    }

    console.log('ensureProfile: Creating shell profile for user:', user.id);

    // Create a shell profile with NULL username
    // Username will be set during onboarding
    const { error } = await sb.from('profiles').insert({
      id: user.id,
      username: null, // No auto-generated username
      display_name: user.user_metadata?.name || 'User',
      bio: null,
      avatar_key: null,
    });

    if (error) {
      // Ignore conflict errors (profile might have been created by trigger)
      if (error.code === '23505') {
        console.log('ensureProfile: Profile already exists (created by trigger)');
        return;
      }
      console.error('ensureProfile: Failed to create profile:', error);
      throw error;
    }

    console.log('ensureProfile: Shell profile created successfully for user:', user.id);
  } catch (error) {
    console.error('ensureProfile: Unexpected error:', error);
    // Don't throw - this is a helper function that shouldn't break the app
  }
}
