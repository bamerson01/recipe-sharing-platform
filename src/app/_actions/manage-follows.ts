'use server';

import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { FollowUserSchema, PaginationSchema, validateRequest } from '@/lib/validation/api-schemas';
import { z } from 'zod';

// Types for Supabase nested objects
interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
}

// Extended schema for getting follows (combines user ID and pagination)
const getFollowsSchema = PaginationSchema.extend({
  userId: z.string().uuid(),
});

// Follow a user
export async function followUser(targetUserId: string) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = await validateRequest(FollowUserSchema, { userId: targetUserId });
    if (!validation.success) {
      return { success: false, error: 'Invalid user ID' };
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      return { success: false, error: 'Already following this user' };
    }

    // Create follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

    if (followError) {
      console.error('Error following user:', followError);
      return { success: false, error: 'Failed to follow user' };
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath(`/u/${targetUserId}`);

    return { success: true, message: 'User followed successfully' };

  } catch (error) {
    console.error('Unexpected error following user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Unfollow a user
export async function unfollowUser(targetUserId: string) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = await validateRequest(FollowUserSchema, { userId: targetUserId });
    if (!validation.success) {
      return { success: false, error: 'Invalid user ID' };
    }

    // Remove follow relationship
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (unfollowError) {
      console.error('Error unfollowing user:', unfollowError);
      return { success: false, error: 'Failed to unfollow user' };
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath(`/u/${targetUserId}`);

    return { success: true, message: 'User unfollowed successfully' };

  } catch (error) {
    console.error('Unexpected error unfollowing user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get followers for a user
export async function getFollowers(userId: string, page: number = 1, limit: number = 20) {
  try {
    const supabase = await getServerSupabase();

    // Validate input
    const validated = getFollowsSchema.safeParse({ userId, page, limit });
    if (!validated.success) {
      return { success: false, error: 'Invalid parameters' };
    }

    const { userId: validatedUserId, page: validatedPage, limit: validatedLimit } = validated.data;
    const offset = (validatedPage - 1) * validatedLimit;

    // Get followers with profile data using manual join
    const { data: followers, error: followersError, count } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        follower_id
      `, { count: 'exact' })
      .eq('following_id', validatedUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + validatedLimit - 1);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return { success: false, error: 'Failed to fetch followers' };
    }

    // Transform data - fetch profile data separately
    const transformedFollowers = [];
    if (followers && followers.length > 0) {
      const followerIds = followers.map(f => f.follower_id);
      
      // Fetch profile data for all followers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_key, bio')
        .in('id', followerIds);
      
      if (profilesError) {
        console.error('Error fetching follower profiles:', profilesError);
        return { success: false, error: 'Failed to fetch follower profiles' };
      }
      
      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Transform the data
      for (const follow of followers) {
        const profile = profileMap.get(follow.follower_id);
        if (profile) {
          transformedFollowers.push({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_key: profile.avatar_key,
            bio: profile.bio,
            followed_at: follow.created_at,
          });
        }
      }
    }

    return {
      success: true,
      followers: transformedFollowers,
      count: count || 0,
      page: validatedPage,
      limit: validatedLimit,
    };

  } catch (error) {
    console.error('Unexpected error fetching followers:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get users that a user is following
export async function getFollowing(userId: string, page: number = 1, limit: number = 20) {
  try {
    const supabase = await getServerSupabase();

    // Validate input
    const validated = getFollowsSchema.safeParse({ userId, page, limit });
    if (!validated.success) {
      return { success: false, error: 'Invalid parameters' };
    }

    const { userId: validatedUserId, page: validatedPage, limit: validatedLimit } = validated.data;
    const offset = (validatedPage - 1) * validatedLimit;

    // Get following with profile data using manual join
    const { data: following, error: followingError, count } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        following_id
      `, { count: 'exact' })
      .eq('follower_id', validatedUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + validatedLimit - 1);

    if (followingError) {
      console.error('Error fetching following:', followingError);
      return { success: false, error: 'Failed to fetch following' };
    }

    // Transform data - fetch profile data separately
    const transformedFollowing = [];
    if (following && following.length > 0) {
      const followedIds = following.map(f => f.following_id);
      
      // Fetch profile data for all followed users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_key, bio')
        .in('id', followedIds);
      
      if (profilesError) {
        console.error('Error fetching followed profiles:', profilesError);
        return { success: false, error: 'Failed to fetch followed profiles' };
      }
      
      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Transform the data
      for (const follow of following) {
        const profile = profileMap.get(follow.following_id);
        if (profile) {
          transformedFollowing.push({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_key: profile.avatar_key,
            bio: profile.bio,
            followed_at: follow.created_at,
          });
        }
      }
    }

    return {
      success: true,
      following: transformedFollowing,
      count: count || 0,
      page: validatedPage,
      limit: validatedLimit,
    };

  } catch (error) {
    console.error('Unexpected error fetching following:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get recent recipes from people the user follows
export async function getRecentFromFollowing(page: number = 1, limit: number = 20) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const offset = (page - 1) * limit;

    // First get the list of users the current user follows
    const { data: followingUsers, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followingError) {
      console.error('Error fetching following users:', followingError);
      return { success: false, error: 'Failed to fetch following users' };
    }

    // If not following anyone, return empty result
    if (!followingUsers || followingUsers.length === 0) {
      return {
        success: true,
        recipes: [],
        count: 0,
        page,
        limit,
      };
    }

    // Extract the user IDs
    const followedUserIds = followingUsers.map(f => f.following_id);

    // Get recipes from followed users
    const { data: recipes, error: recipesError, count } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        like_count,
        is_public,
        created_at,
        updated_at,
        author:profiles!recipes_author_id_fkey(
          id,
          username,
          display_name,
          avatar_key
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .in('author_id', followedUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (recipesError) {
      console.error('Error fetching recipes from following:', recipesError);
      return { success: false, error: 'Failed to fetch recipes' };
    }

    // Transform data
    const transformedRecipes = recipes?.map(recipe => ({
      ...recipe,
      author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
    })) || [];

    return {
      success: true,
      recipes: transformedRecipes,
      count: count || 0,
      page,
      limit,
    };

  } catch (error) {
    console.error('Unexpected error fetching recipes from following:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
