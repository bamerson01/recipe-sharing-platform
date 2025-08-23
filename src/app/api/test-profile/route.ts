import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {      return NextResponse.json({
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 });
    }
    // Test auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {      return NextResponse.json({
        error: 'Auth failed',
        details: userError.message
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: 'Profile API test successful',
      database: 'connected',
      auth: user ? 'authenticated' : 'not authenticated',
      userId: user?.id || null
    });

  } catch (error) {    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
