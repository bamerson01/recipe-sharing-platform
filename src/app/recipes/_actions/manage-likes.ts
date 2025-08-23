'use server';

import { getServerSupabase } from '@/lib/db/server';

export async function getUserLikesCount(userId: string) {
  try {
    const supabase = await getServerSupabase();

    // Count how many recipes the user has liked
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {      return { success: false, error: 'Failed to fetch likes count' };
    }

    return { success: true, count: count || 0 };

  } catch (error) {    return { success: false, error: 'An unexpected error occurred' };
  }
}
