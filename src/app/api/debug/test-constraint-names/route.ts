import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    const results = {
      follows_tests: [] as any[],
      likes_tests: [] as any[]
    };

    // Test different constraint name variations for follows table
    const followsConstraintNames = [
      'follows_follower_id_fkey',
      'follows_followed_id_fkey',
      'follows_follower_id_profiles_id_fk',
      'follows_followed_id_profiles_id_fk',
      'follows_follower_id_fk',
      'follows_followed_id_fk'
    ];

    for (const constraintName of followsConstraintNames) {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select(`
            id,
            follower:profiles!${constraintName}(
              id,
              username,
              display_name
            )
          `)
          .limit(1);
        
        results.follows_tests.push({
          constraint_name: constraintName,
          success: !error,
          error: error?.message || null,
          data: data ? 'Data returned' : 'No data'
        });
      } catch (e) {
        results.follows_tests.push({
          constraint_name: constraintName,
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error',
          data: 'Exception thrown'
        });
      }
    }

    // Test different constraint name variations for likes table
    const likesConstraintNames = [
      'likes_user_id_fkey',
      'likes_recipe_id_fkey',
      'likes_user_id_profiles_id_fk',
      'likes_recipe_id_recipes_id_fk',
      'likes_user_id_fk',
      'likes_recipe_id_fk'
    ];

    for (const constraintName of likesConstraintNames) {
      try {
        const { data, error } = await supabase
          .from('likes')
          .select(`
            id,
            liker:profiles!${constraintName}(
              id,
              username,
              display_name
            )
          `)
          .limit(1);
        
        results.likes_tests.push({
          constraint_name: constraintName,
          success: !error,
          error: error?.message || null,
          data: data ? 'Data returned' : 'No data'
        });
      } catch (e) {
        results.likes_tests.push({
          constraint_name: constraintName,
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error',
          data: 'Exception thrown'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Constraint name tests completed',
      results
    });

  } catch (error) {    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
