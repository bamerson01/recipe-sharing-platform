// Server-only helper to ensure a profile exists for the current user with unique username handling
import { getServerSupabase } from '@/lib/db/server';

async function generateUniqueUsername(baseUsername: string, supabase: any): Promise<string> {
  let username = baseUsername;
  let attempt = 0;
  
  while (attempt < 100) { // Prevent infinite loop
    // Check if username exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    if (!existing) {
      return username; // Username is available
    }
    
    // Username taken, try with a number suffix
    attempt++;
    username = `${baseUsername}${attempt}`;
  }
  
  // If we couldn't find a unique username with numbers, use UUID portion
  const uuid = crypto.randomUUID().slice(0, 8);
  return `${baseUsername}_${uuid}`;
}

export async function ensureProfileWithUniqueUsername() {
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

    console.log('ensureProfile: Creating missing profile for user:', user.id);

    // Generate base username from email or metadata
    const baseUsername = (user.user_metadata?.username as string | undefined)
      ?? user.email?.split('@')[0]
      ?? `user_${user.id.slice(0, 6)}`;
    
    // Sanitize username (remove special characters, lowercase)
    const sanitizedBase = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30); // Limit length
    
    // Generate unique username
    const uniqueUsername = await generateUniqueUsername(sanitizedBase, sb);
    
    console.log(`ensureProfile: Generated unique username: ${uniqueUsername} for base: ${sanitizedBase}`);

    const { error } = await sb.from('profiles').insert({
      id: user.id,
      username: uniqueUsername,
      display_name: user.user_metadata?.name ?? uniqueUsername,
      bio: null,
      avatar_key: null,
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