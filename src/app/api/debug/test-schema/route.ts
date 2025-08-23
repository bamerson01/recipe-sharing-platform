import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    const results = {
      follows_schema: null,
      likes_schema: null,
      recipe_comments_schema: null,
      sample_data: {
        follows: null,
        likes: null,
        recipe_comments: null
      }
    };

    // Check follows table structure
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .limit(3);
      
      if (!followsError && followsData && followsData.length > 0) {
        results.follows_schema = {
          exists: true,
          sample_row: followsData[0],
          columns: Object.keys(followsData[0])
        };
        results.sample_data.follows = followsData;
      } else {
        results.follows_schema = {
          exists: false,
          error: followsError?.message
        };
      }
    } catch (e) {
      results.follows_schema = { 
        exists: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Check likes table structure
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .limit(3);
      
      if (!likesError && likesData && likesData.length > 0) {
        results.likes_schema = {
          exists: true,
          sample_row: likesData[0],
          columns: Object.keys(likesData[0])
        };
        results.sample_data.likes = likesData;
      } else {
        results.likes_schema = {
          exists: false,
          error: likesError?.message
        };
      }
    } catch (e) {
      results.likes_schema = { 
        exists: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    // Check recipe_comments table structure
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('recipe_comments')
        .select('*')
        .limit(3);
      
      if (!commentsError && commentsData && commentsData.length > 0) {
        results.recipe_comments_schema = {
          exists: true,
          sample_row: commentsData[0],
          sample_row_keys: Object.keys(commentsData[0])
        };
        results.sample_data.recipe_comments = commentsData;
      } else {
        results.recipe_comments_schema = {
          exists: false,
          error: commentsError?.message
        };
      }
    } catch (e) {
      results.recipe_comments_schema = { 
        exists: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Schema check completed',
      results
    });

  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
