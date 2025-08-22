// Server-only helper to ensure a profile exists for the current user
import { getServerSupabase } from '@/lib/db/server';

export async function ensureProfile() {
  try {
    const sb = getServerSupabase();
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

    console.log('ensureProfile: Creating missing profile for user:', user.id);

    const username = (user.user_metadata?.username as string | undefined)
      ?? user.email?.split('@')[0]
      ?? `user_${user.id.slice(0, 6)}`;

    const { error } = await sb.from('profiles').insert({
      id: user.id,
      username,
      display_name: user.user_metadata?.name ?? username,
      // avatar_key: null — optional; your schema allows null
    });

    if (error) {
      console.error('ensureProfile: Failed to create profile:', error);
      throw error;
    }

    console.log('ensureProfile: Profile created successfully for user:', user.id);
  } catch (error) {
    console.error('ensureProfile: Unexpected error:', error);
    // Don't throw - this is a helper function that shouldn't break the app
  }
}
