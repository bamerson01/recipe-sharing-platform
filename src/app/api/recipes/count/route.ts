import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count recipes for the user
    const { count, error } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    if (error) {
      console.error('Error counting recipes:', error);
      return NextResponse.json({ error: 'Failed to count recipes' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
