import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const categories = searchParams.get('categories');
    const sortBy = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    // Parse category IDs
    let categoryIds: number[] | null = null;
    if (categories) {
      categoryIds = categories.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    // Validate sort parameter
    const validSorts = ['relevance', 'newest', 'top'];
    const sort = validSorts.includes(sortBy) ? sortBy : 'relevance';

    const supabase = await getServerSupabase();

    // Build the base query - simplified for now
    let queryBuilder = supabase
      .from('recipes')
      .select(`
        id,
        title,
        slug,
        summary,
        cover_image_key,
        is_public,
        like_count,
        created_at,
        updated_at,
        author_id
      `)
      .eq('is_public', true);

    // Add search filter if query exists
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
    }

    // Add sorting
    if (sort === 'newest') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    } else if (sort === 'top') {
      queryBuilder = queryBuilder.order('like_count', { ascending: false });
    } else {
      // Default: relevance (newest first)
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    // Add pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: recipes, error } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Transform the data to match our expected format
    const transformedRecipes = await Promise.all(
      (recipes || []).map(async (recipe) => {
        // Fetch author profile
        const { data: author } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_key')
          .eq('id', recipe.author_id)
          .single();

        // Fetch categories for this recipe
        const { data: categories } = await supabase
          .from('recipe_categories')
          .select(`
            category_id,
            categories!inner(
              id,
              name,
              slug
            )
          `)
          .eq('recipe_id', recipe.id);

        return {
          id: recipe.id,
          title: recipe.title,
          slug: recipe.slug,
          summary: recipe.summary,
          cover_image_key: recipe.cover_image_key,
          is_public: recipe.is_public,
          like_count: recipe.like_count,
          created_at: recipe.created_at,
          updated_at: recipe.updated_at,
          author: {
            id: author?.id || recipe.author_id,
            display_name: author?.display_name || 'Unknown',
            username: author?.username || 'unknown',
            avatar_key: author?.avatar_key || null,
          },
          categories: categories?.map(c => c.categories) || [],
          search_rank: 0 // Placeholder for now
        };
      })
    );

    return NextResponse.json({
      recipes: transformedRecipes,
      pagination: {
        page,
        limit,
        hasMore: transformedRecipes.length === limit
      }
    });

  } catch (error) {
    console.error('Unexpected search error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
