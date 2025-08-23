import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';
import { getFollowers, getFollowing } from '@/app/_actions/manage-follows';
import { getWhoLikedMyRecipes, getWhoCommentedOnMyRecipes } from '@/app/_actions/track-interactions';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const results = {
      user: { id: user.id, email: user.email },
      actions: {
        getFollowers: null,
        getFollowing: null,
        getWhoLikedMyRecipes: null,
        getWhoCommentedOnMyRecipes: null
      }
    };

    // Test getFollowers
    try {
      const followersResult = await getFollowers(user.id, 1, 5);
      results.actions.getFollowers = {
        success: followersResult.success,
        error: followersResult.error,
        count: followersResult.followers?.length || 0
      };
    } catch (e) {
      results.actions.getFollowers = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Test getFollowing
    try {
      const followingResult = await getFollowing(user.id, 1, 5);
      results.actions.getFollowing = {
        success: followingResult.success,
        error: followingResult.error,
        count: followingResult.following?.length || 0
      };
    } catch (e) {
      results.actions.getFollowing = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Test getWhoLikedMyRecipes
    try {
      const likesResult = await getWhoLikedMyRecipes(1, 5);
      results.actions.getWhoLikedMyRecipes = {
        success: likesResult.success,
        error: likesResult.error,
        count: likesResult.likes?.length || 0
      };
    } catch (e) {
      results.actions.getWhoLikedMyRecipes = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Test getWhoCommentedOnMyRecipes
    try {
      const commentsResult = await getWhoCommentedOnMyRecipes(1, 5);
      results.actions.getWhoCommentedOnMyRecipes = {
        success: commentsResult.success,
        error: commentsResult.error,
        count: commentsResult.comments?.length || 0
      };
    } catch (e) {
      results.actions.getWhoCommentedOnMyRecipes = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Fixed server actions test completed',
      results
    });

  } catch (error) {
    console.error('Error testing fixed server actions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
