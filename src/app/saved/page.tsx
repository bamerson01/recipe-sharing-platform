import { Suspense } from "react";
import { getServerSupabase } from "@/lib/db/server";
import { getUserSavedRecipes } from "@/app/recipes/_actions/manage-saves";
import { SearchFilters } from "@/components/search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { SavedRecipesContent } from "./saved-recipes-content";

async function SavedRecipesServer() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign in to view saved recipes</h3>
        <p className="text-muted-foreground mb-4">
          Create an account to save recipes and access them later
        </p>
        <Button asChild>
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  const result = await getUserSavedRecipes(user.id, 50); // Fetch more initially

  if (!result.success || !result.recipes) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to load saved recipes</h3>
        <p className="text-muted-foreground mb-4">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  if (result.recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved recipes yet</h3>
        <p className="text-muted-foreground mb-4">
          Start exploring recipes and save the ones you want to try later
        </p>
        <Button asChild>
          <Link href="/discover">Explore Recipes</Link>
        </Button>
      </div>
    );
  }

  return <SavedRecipesContent initialRecipes={result.recipes} userId={user.id} />;
}

export default function SavedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Recipes</h1>
        <p className="text-muted-foreground">
          Your personal collection of recipes to try later
        </p>
      </div>

      <SearchFilters />

      <Suspense fallback={<SavedRecipesSkeleton />}>
        <SavedRecipesServer />
      </Suspense>
    </div>
  );
}

function SavedRecipesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}