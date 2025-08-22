import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();

    // Simple query to test basic functionality
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        is_public,
        like_count,
        created_at
      `)
      .eq('is_public', true)
      .limit(5);

    if (error) {
      console.error('Test search error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
      count: recipes?.length || 0
    });

  } catch (error) {
    console.error('Unexpected test search error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
