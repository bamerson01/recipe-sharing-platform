"use client";

import { Suspense, useEffect, useState } from "react";
import { RecipeGrid } from "@/components/recipe-grid";
import { SearchFilters } from "@/components/search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const [initialQuery, setInitialQuery] = useState("");
  const [initialCategories, setInitialCategories] = useState<number[]>([]);
  const [initialSort, setInitialSort] = useState("relevance");

  useEffect(() => {
    const query = searchParams.get('q') || '';
    const categories = searchParams.get('categories');
    const sort = searchParams.get('sort') || 'relevance';

    setInitialQuery(query);
    if (categories) {
      setInitialCategories(categories.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)));
    }
    setInitialSort(sort);
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Recipes</h1>
        <p className="text-muted-foreground">
          Discover delicious recipes from our community
        </p>
      </div>

      <Suspense fallback={<RecipeGridSkeleton />}>
        <RecipeGrid
          initialQuery={initialQuery}
          initialCategories={initialCategories}
          initialSort={initialSort}
        />
      </Suspense>
    </div>
  );
}

function RecipeGridSkeleton() {
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
