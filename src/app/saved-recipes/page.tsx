import { Suspense } from "react";
import { getServerSupabase } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SavedRecipesServer } from "./_components/saved-recipes-server";

async function SavedRecipesPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Recipes</h1>
        <p className="text-muted-foreground">
          Your personal collection of recipes to try later
        </p>
      </div>

      <Suspense fallback={<SavedRecipesSkeleton />}>
        <SavedRecipesServer />
      </Suspense>
    </div>
  );
}

function SavedRecipesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SavedRecipesPage;
