import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Query to check actual foreign key constraints
    const { data: constraints, error } = await supabase.rpc('get_foreign_keys', {
      table_names: ['follows', 'likes', 'recipe_comments']
    });

    if (error) {
      // Fallback: try direct SQL query
      const { data: directConstraints, error: directError } = await supabase
        .from('information_schema.table_constraints')
        .select(`
          table_name,
          constraint_name,
          constraint_type
        `)
        .eq('constraint_type', 'FOREIGN KEY')
        .in('table_name', ['follows', 'likes', 'recipe_comments']);

      if (directError) {
        return NextResponse.json({
          error: 'Failed to query constraints',
          details: directError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Foreign key constraints found',
        constraints: directConstraints,
        method: 'direct_query'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key constraints found via RPC',
      constraints,
      method: 'rpc'
    });

  } catch (error) {
    console.error('Error checking constraints:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
