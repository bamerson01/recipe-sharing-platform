import { notFound, redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/db/server";
import { EditRecipeForm } from "./edit-recipe-form";

interface EditRecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const supabase = await getServerSupabase();
  const { id } = await params;

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth');
  }

  // Parse recipe ID
  const recipeId = parseInt(id);
  if (isNaN(recipeId)) {
    notFound();
  }

  // Fetch recipe with ownership check
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      id,
      title,
      slug,
      summary,
      cover_image_key,
      is_public,
      author_id,
      difficulty,
      prep_time,
      cook_time,
      created_at,
      updated_at
    `)
    .eq('id', recipeId)
    .single();

  if (recipeError || !recipe) {
    notFound();
  }

  // Check ownership
  if (recipe.author_id !== user.id) {
    redirect('/recipes/my');
  }

  // Fetch recipe details
  const [ingredientsResult, stepsResult, categoriesResult] = await Promise.all([
    supabase
      .from('recipe_ingredients')
      .select('id, position, text')
      .eq('recipe_id', recipeId)
      .order('position'),
    supabase
      .from('recipe_steps')
      .select('id, position, text')
      .eq('recipe_id', recipeId)
      .order('position'),
    supabase
      .from('recipe_categories')
      .select(`
        category_id,
        categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('recipe_id', recipeId)
  ]);

  // Fetch all categories for the form
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  const recipeWithDetails = {
    ...recipe,
    ingredients: ingredientsResult.data || [],
    steps: stepsResult.data || [],
    categories: categoriesResult.data?.map(c => Array.isArray(c.categories) ? c.categories[0] : c.categories).filter(Boolean) || [],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Recipe</h1>
          <p className="text-muted-foreground">
            Update your recipe details and ingredients
          </p>
        </div>

        <EditRecipeForm
          recipe={recipeWithDetails}
          categories={allCategories || []}
        />
      </div>
    </div>
  );
}
