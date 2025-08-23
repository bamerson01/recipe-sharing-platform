import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    const results: {
      follows_test: any;
      likes_test: any;
      comments_test: any;
    } = {
      follows_test: null,
      likes_test: null,
      comments_test: null
    };

    // Test follows with profile join
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select(`
          id,
          created_at,
          follower:profiles!follows_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_key,
            bio
          )
        `)
        .limit(1);
      
      results.follows_test = {
        success: !followsError,
        error: followsError?.message,
        data: followsData,
        sample: followsData?.[0]
      };
    } catch (e) {
      results.follows_test = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Test likes with recipe and profile join
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          recipe:recipes!likes_recipe_id_fkey(
            id,
            title,
            slug
          ),
          liker:profiles!likes_user_id_fkey(
            id,
            username,
            display_name,
            avatar_key
          )
        `)
        .limit(1);
      
      results.likes_test = {
        success: !likesError,
        error: likesError?.message,
        data: likesData,
        sample: likesData?.[0]
      };
    } catch (e) {
      results.likes_test = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Test recipe_comments with recipe and profile join
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('recipe_comments')
        .select(`
          id,
          body,
          created_at,
          recipe:recipes!recipe_comments_recipe_id_fkey(
            id,
            title,
            slug
          ),
          commenter:profiles!recipe_comments_user_id_fkey(
            id,
            username,
            display_name,
            avatar_key
          )
        `)
        .limit(1);
      
      results.comments_test = {
        success: !commentsError,
        error: commentsError?.message,
        data: commentsData,
        sample: commentsData?.[0]
      };
    } catch (e) {
      results.comments_test = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key test completed',
      results
    });

  } catch (error) {    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
