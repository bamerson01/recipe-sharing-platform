import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

export async function GET() {
  try {
    console.log('Testing profile API...');

    const supabase = await getServerSupabase();
    console.log('Supabase client created');

    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Database connection test failed:', testError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 });
    }

    console.log('Database connection successful');

    // Test auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth test failed:', userError);
      return NextResponse.json({
        error: 'Auth failed',
        details: userError.message
      }, { status: 500 });
    }

    console.log('Auth successful, user:', user?.id || 'none');

    return NextResponse.json({
      success: true,
      message: 'Profile API test successful',
      database: 'connected',
      auth: user ? 'authenticated' : 'not authenticated',
      userId: user?.id || null
    });

  } catch (error) {
    console.error('Unexpected error in test:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
