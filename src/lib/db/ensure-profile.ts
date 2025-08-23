// Server-only helper to ensure a profile exists for the current user
import { getServerSupabase } from '@/lib/db/server';

export async function ensureProfile() {
  try {
    const sb = await getServerSupabase();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {      return;
    }

    // If row exists, bail early
    const { data: existing } = await sb
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {      return;
    }
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
      if (error.code === '23505') {        return;
      }      throw error;
    }  } catch (error) {    // Don't throw - this is a helper function that shouldn't break the app
  }
}
