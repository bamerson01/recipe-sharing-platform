import { Suspense } from "react";
import { SavedRecipesGrid } from "@/components/saved-recipes-grid";
import { SearchFilters } from "@/components/search-filters";
import { Skeleton } from "@/components/ui/skeleton";

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
        <SavedRecipesGrid />
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
