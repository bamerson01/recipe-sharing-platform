import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        userError: userError?.message 
      }, { status: 401 });
    }

    // Get a user to test with (not ourselves)
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id, username')
      .neq('id', user.id)
      .limit(1)
      .single();

    if (!testUser) {
      return NextResponse.json({ error: 'No other users to test with' });
    }

    const results = {
      currentUser: user.id,
      testUser: testUser,
      tests: {} as any
    };

    // Test 1: Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('followed_id', testUser.id)
      .single();

    results.tests.checkExisting = {
      exists: !!existingFollow,
      data: existingFollow,
      error: checkError?.message
    };

    // Test 2: Try to insert a follow (if not already following)
    if (!existingFollow) {
      const { data: insertData, error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          followed_id: testUser.id
        })
        .select();

      results.tests.insert = {
        success: !insertError,
        data: insertData,
        error: insertError?.message,
        errorDetails: insertError
      };

      // If insert succeeded, delete it to clean up
      if (insertData && !insertError) {
        const { error: deleteError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', testUser.id);

        results.tests.cleanup = {
          success: !deleteError,
          error: deleteError?.message
        };
      }
    } else {
      results.tests.insert = {
        skipped: true,
        reason: 'Already following this user'
      };
    }

    // Test 3: Check RLS policies
    const { data: rlsCheck } = await supabase
      .rpc('check_rls_policies', { table_name: 'follows' })
      .catch(() => ({ data: null }));

    results.tests.rls = rlsCheck || 'Could not check RLS policies';

    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}