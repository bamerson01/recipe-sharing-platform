import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    // Only allow in development or for authenticated admin users
    if (process.env.NODE_ENV === 'production' && !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if tables exist and have data
    const results = {
      follows: null,
      likes: null,
      recipe_comments: null,
      profiles: null,
      recipes: null
    };

    // Test follows table
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .limit(1);
      
      results.follows = {
        exists: !followsError,
        error: followsError?.message,
        count: followsData?.length || 0
      };
    } catch (e) {
      results.follows = { exists: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }

    // Test likes table
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .limit(1);
      
      results.likes = {
        exists: !likesError,
        error: likesError?.message,
        count: likesData?.length || 0
      };
    } catch (e) {
      results.likes = { exists: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }

    // Test recipe_comments table
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('recipe_comments')
        .select('*')
        .limit(1);
      
      results.recipe_comments = {
        exists: !commentsError,
        error: commentsError?.message,
        count: commentsData?.length || 0
      };
    } catch (e) {
      results.recipe_comments = { exists: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }

    // Test profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      results.profiles = {
        exists: !profilesError,
        error: profilesError?.message,
        count: profilesData?.length || 0
      };
    } catch (e) {
      results.profiles = { exists: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }

    // Test recipes table
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .limit(1);
      
      results.recipes = {
        exists: !recipesError,
        error: recipesError?.message,
        count: recipesData?.length || 0
      };
    } catch (e) {
      results.recipes = { exists: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      message: 'Table existence check completed',
      results
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
