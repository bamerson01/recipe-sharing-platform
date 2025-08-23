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
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ 
        error: 'Invalid pagination parameters' 
      }, { status: 400 });
    }

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
        difficulty,
        prep_time,
        cook_time,
        created_at,
        updated_at,
        author_id
      `)
      .eq('is_public', true);

    // Add category filter if categories are selected
    if (categoryIds && categoryIds.length > 0) {
      // We need to filter recipes that have ANY of the selected categories
      // First, get recipe IDs that have the selected categories
      const { data: recipesInCategories } = await supabase
        .from('recipe_categories')
        .select('recipe_id')
        .in('category_id', categoryIds);
      
      if (recipesInCategories && recipesInCategories.length > 0) {
        const recipeIds = recipesInCategories.map(r => r.recipe_id);
        queryBuilder = queryBuilder.in('id', recipeIds);
      } else {
        // No recipes found with these categories, return empty result
        return NextResponse.json({
          recipes: [],
          pagination: {
            page,
            limit,
            hasMore: false
          }
        });
      }
    }

    // Add search filter if query exists
    if (query && query.trim()) {
      // Sanitize the query to prevent SQL injection
      const sanitizedQuery = query.trim().replace(/[%_]/g, '\\$&');
      queryBuilder = queryBuilder.or(`title.ilike.%${sanitizedQuery}%,summary.ilike.%${sanitizedQuery}%`);
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Search error:', error);
      }
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({
        recipes: [],
        pagination: {
          page,
          limit,
          hasMore: false
        }
      });
    }

    // Batch fetch all related data to avoid N+1 queries
    const recipeIds = recipes.map(r => r.id);
    const authorIds = [...new Set(recipes.map(r => r.author_id))];
    
    // Batch fetch all authors
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_key')
      .in('id', authorIds);
    
    // Batch fetch all categories
    const { data: allCategories } = await supabase
      .from('recipe_categories')
      .select(`
        recipe_id,
        category_id,
        categories!inner(
          id,
          name,
          slug
        )
      `)
      .in('recipe_id', recipeIds);
    
    // Batch fetch all ingredients
    const { data: allIngredients } = await supabase
      .from('recipe_ingredients')
      .select('recipe_id, id, position, text')
      .in('recipe_id', recipeIds)
      .order('position', { ascending: true });
    
    // Batch fetch all steps
    const { data: allSteps } = await supabase
      .from('recipe_steps')
      .select('recipe_id, id, position, text')
      .in('recipe_id', recipeIds)
      .order('position', { ascending: true });
    
    // Create lookup maps for efficient data association
    const authorsMap = new Map((authors || []).map(a => [a.id, a]));
    const categoriesMap = new Map<number, any[]>();
    const ingredientsMap = new Map<number, any[]>();
    const stepsMap = new Map<number, any[]>();
    
    // Group categories by recipe
    (allCategories || []).forEach((item: any) => {
      if (!categoriesMap.has(item.recipe_id)) {
        categoriesMap.set(item.recipe_id, []);
      }
      categoriesMap.get(item.recipe_id)?.push(item.categories);
    });
    
    // Group ingredients by recipe
    (allIngredients || []).forEach((item: any) => {
      if (!ingredientsMap.has(item.recipe_id)) {
        ingredientsMap.set(item.recipe_id, []);
      }
      ingredientsMap.get(item.recipe_id)?.push({
        id: item.id,
        position: item.position,
        text: item.text
      });
    });
    
    // Group steps by recipe
    (allSteps || []).forEach((item: any) => {
      if (!stepsMap.has(item.recipe_id)) {
        stepsMap.set(item.recipe_id, []);
      }
      stepsMap.get(item.recipe_id)?.push({
        id: item.id,
        position: item.position,
        text: item.text
      });
    });
    
    // Transform the data to match our expected format
    const transformedRecipes = recipes.map((recipe) => {
      const author = authorsMap.get(recipe.author_id);
      const categories = categoriesMap.get(recipe.id) || [];
      const ingredients = ingredientsMap.get(recipe.id) || [];
      const steps = stepsMap.get(recipe.id) || [];

      return {
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        summary: recipe.summary,
        cover_image_key: recipe.cover_image_key,
        is_public: recipe.is_public,
        like_count: recipe.like_count,
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        author: {
          id: author?.id || recipe.author_id,
          display_name: author?.display_name || 'Unknown',
          username: author?.username || 'unknown',
          avatar_key: author?.avatar_key || null,
        },
        categories: categories,
        ingredients: ingredients,
        steps: steps,
        search_rank: 0 // Placeholder for now
      };
    });

    return NextResponse.json({
      recipes: transformedRecipes,
      pagination: {
        page,
        limit,
        hasMore: transformedRecipes.length === limit
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unexpected search error:', error);
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}