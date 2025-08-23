import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/server';
import { RecipeSummary, Author, CategoryMini } from '@/types/recipe';

interface SavedRecipeRow {
  recipe_id: number;
  created_at: string;
  recipe: {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    cover_image_key: string | null;
    is_public: boolean;
    like_count: number;
    difficulty: string | null;
    prep_time: number | null;
    cook_time: number | null;
    created_at: string;
    updated_at: string;
    author: Author | Author[];
  } | Array<{
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    cover_image_key: string | null;
    is_public: boolean;
    like_count: number;
    difficulty: string | null;
    prep_time: number | null;
    cook_time: number | null;
    created_at: string;
    updated_at: string;
    author: Author | Author[];
  }>;
}

interface CategoryRow {
  category: CategoryMini;
}

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
      return NextResponse.json({ error: 'Failed to fetch saved recipes' }, { status: 500 });
    }

    // Transform the data to extract recipes with proper typing
    const recipes = await Promise.all(
      ((saves || []) as SavedRecipeRow[]).map(async (save) => {
        // Recipe is returned as an array due to Supabase's nested select behavior
        const recipeData = Array.isArray(save.recipe) ? save.recipe[0] : save.recipe;
        
        if (!recipeData) return null;
        
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
          .eq('recipe_id', recipeData.id);

        // Get save and comment counts
        const { count: saveCount } = await supabase
          .from('saves')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', recipeData.id);

        const { count: commentCount } = await supabase
          .from('recipe_comments')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', recipeData.id);

        // Check if user has liked this recipe
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('recipe_id', recipeData.id)
          .eq('user_id', user.id)
          .single();

        const authorData = Array.isArray(recipeData.author) ? recipeData.author[0] : recipeData.author;
        
        const recipeSummary: RecipeSummary = {
          id: recipeData.id,
          slug: recipeData.slug,
          title: recipeData.title,
          summary: recipeData.summary,
          cover_image_key: recipeData.cover_image_key,
          like_count: recipeData.like_count,
          difficulty: recipeData.difficulty as 'easy' | 'medium' | 'hard' | null,
          prep_time: recipeData.prep_time,
          cook_time: recipeData.cook_time,
          author: authorData as Author,
          categories: ((categories as CategoryRow[] | null)?.map(c => c.category) || []),
          updated_at: recipeData.updated_at,
          created_at: recipeData.created_at,
          is_public: recipeData.is_public,
          save_count: saveCount || 0,
          comment_count: commentCount || 0,
          is_saved: true, // Always true since these are saved recipes
          is_liked: !!like
        };
        
        return recipeSummary;
      })
    );
    
    // Filter out any null recipes
    const validRecipes = recipes.filter((recipe): recipe is RecipeSummary => recipe !== null);

    return NextResponse.json({ 
      recipes: validRecipes,
      total: validRecipes.length 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}