import { getServerSupabase } from "@/lib/db/server";
import { getUserSavedRecipes } from "@/app/recipes/_actions/manage-saves";
import { SavedRecipesGrid } from "./saved-recipes-grid";

export async function SavedRecipesServer() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const result = await getUserSavedRecipes(user.id, 50); // Fetch more initially

  if (!result.success || !result.recipes) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Unable to load saved recipes
        </p>
      </div>
    );
  }

  return <SavedRecipesGrid initialRecipes={result.recipes} />;
}
