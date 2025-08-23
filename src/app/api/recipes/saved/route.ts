import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch saved recipes
    const { data: saves, error: savesError } = await supabase
      .from('saves')
      .select(`
        recipe_id,
        created_at,
        recipe:recipes!inner(
          id,
          title,
          slug,
          summary,
          cover_image_key,
          is_public,
          like_count,
          difficulty,
          prep_time,
          cook_time,
          created_at,
          updated_at,
          author:profiles!inner(
            id,
            username,
            display_name,
            avatar_key
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savesError) {
      console.error('Error fetching saved recipes:', savesError);
      return NextResponse.json({ error: 'Failed to fetch saved recipes' }, { status: 500 });
    }

    // Transform the data to extract recipes
    const recipes = await Promise.all(
      (saves || []).map(async (save) => {
        const recipe = save.recipe;
        
        // Fetch categories for each recipe
        const { data: categories } = await supabase
          .from('recipe_categories')
          .select(`
            category:categories!inner(
              id,
              name,
              slug
            )
          `)
          .eq('recipe_id', recipe.id);

        // Get save and comment counts
        const { count: saveCount } = await supabase
          .from('saves')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', recipe.id);

        const { count: commentCount } = await supabase
          .from('recipe_comments')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', recipe.id);

        // Check if user has liked this recipe
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('recipe_id', recipe.id)
          .eq('user_id', user.id)
          .single();

        return {
          ...recipe,
          categories: categories?.map(c => c.category) || [],
          save_count: saveCount || 0,
          comment_count: commentCount || 0,
          is_liked: !!like,
          is_saved: true, // Always true for saved recipes
        };
      })
    );

    return NextResponse.json({ 
      recipes,
      total: recipes.length 
    });

  } catch (error) {
    console.error('Error in saved recipes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}