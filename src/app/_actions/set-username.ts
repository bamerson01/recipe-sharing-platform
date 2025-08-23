'use server';

import { z } from 'zod';
import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { UsernameSchema, RESERVED_USERNAMES } from '@/lib/validation/username';

const SetUsernameInput = z.object({
  username: UsernameSchema,
});

export async function setUsername(formData: FormData) {
  try {
    // Parse and validate input
    const rawUsername = formData.get('username');
    const parsed = SetUsernameInput.safeParse({ 
      username: String(rawUsername || '') 
    });
    
    if (!parsed.success) {
      const error = parsed.error.issues[0]?.message || 'Invalid username format';
      return { ok: false, error } as const;
    }

    // Normalize to lowercase
    const username = parsed.data.username.toLowerCase();
    
    // Double-check reserved names
    if (RESERVED_USERNAMES.has(username)) {
      return { ok: false, error: 'This username is reserved' } as const;
    }

    // Get current user
    const sb = await getServerSupabase();
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError || !user) {
      return { ok: false, error: 'You must be logged in to set a username' } as const;
    }

    // Check if user already has a username
    const { data: currentProfile, error: fetchError } = await sb
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    
    if (fetchError) {      return { ok: false, error: 'Failed to fetch profile' } as const;
    }
    
    // If no profile exists, create one first
    if (!currentProfile) {      const { error: createError } = await sb
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          bio: null,
          avatar_key: null,
        });
      
      if (createError) {
        // Handle unique constraint violation
        if (createError.code === '23505' || createError.message?.includes('unique')) {
          return { ok: false, error: 'Username already taken' } as const;
        }        return { ok: false, error: 'Failed to create profile' } as const;
      }
      
      // Profile created with username, we're done
      revalidatePath('/');
      revalidatePath('/profile');
      revalidatePath('/onboarding');
      revalidatePath('/recipes/my');
      
      return { ok: true } as const;
    }
    
    // Profile exists, check if it already has a username
    if (currentProfile.username) {
      return { ok: false, error: 'You already have a username' } as const;
    }

    // Attempt to update username
    const { error: updateError } = await sb
      .from('profiles')
      .update({ username })
      .eq('id', user.id);
    
    if (updateError) {
      // Handle unique constraint violation (case-insensitive)
      if (updateError.code === '23505' || updateError.message?.includes('unique')) {
        return { ok: false, error: 'Username already taken' } as const;
      }      return { ok: false, error: 'Failed to update username' } as const;
    }

    // Revalidate all relevant paths
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/onboarding');
    revalidatePath('/recipes/my');
    
    return { ok: true } as const;
    
  } catch (error) {    return { ok: false, error: 'An unexpected error occurred' } as const;
  }
}

// Server function to check username availability (for live validation)
export async function checkUsernameAvailability(username: string) {
  try {
    // Quick format check
    const parsed = UsernameSchema.safeParse(username);
    if (!parsed.success) {
      return { available: false, reason: 'invalid' } as const;
    }
    
    const normalizedUsername = parsed.data.toLowerCase();
    
    // Check reserved
    if (RESERVED_USERNAMES.has(normalizedUsername)) {
      return { available: false, reason: 'reserved' } as const;
    }
    
    // Check database
    const sb = await getServerSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('id')
      .ilike('username', normalizedUsername)
      .maybeSingle();
    
    if (error) {      return { available: false, reason: 'error' } as const;
    }
    
    if (data) {
      return { available: false, reason: 'taken' } as const;
    }
    
    return { available: true } as const;
    
  } catch (error) {    return { available: false, reason: 'error' } as const;
  }
}