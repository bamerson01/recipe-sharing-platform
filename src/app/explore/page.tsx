"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { RecipeGrid } from "@/components/recipe-grid-unified";
import { SearchFilters } from "@/components/search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { RecipeSummary } from "@/types/recipe";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load recipes when filters change
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: '1',
          limit: '20'
        });

        const query = searchParams.get('q');
        const categories = searchParams.get('categories');
        const sort = searchParams.get('sort');

        if (query) params.append('q', query);
        if (categories) params.append('categories', categories);
        if (sort) params.append('sort', sort);

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();

        setRecipes(data.recipes || []);
        setPage(2); // Next page will be 2
        setHasMore(data.recipes && data.recipes.length === 20);
      } catch (error) {
        console.error('Failed to load recipes:', error);
        setRecipes([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [searchParams]);

  const loadRecipes = useCallback(async (reset = false) => {
    if (reset) {
      // This case is handled by the useEffect above
      return;
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      const query = searchParams.get('q');
      const categories = searchParams.get('categories');
      const sort = searchParams.get('sort');

      if (query) params.append('q', query);
      if (categories) params.append('categories', categories);
      if (sort) params.append('sort', sort);

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      setRecipes(prev => [...prev, ...(data.recipes || [])]);
      setPage(page + 1);
      setHasMore(data.recipes && data.recipes.length === 20);
    } catch (error) {
      console.error('Failed to load more recipes:', error);
      setHasMore(false);
    }
  }, [searchParams, page]);

  const handleLoadMore = async () => {
    await loadRecipes(false);
    return { recipes, hasMore };
  };

  // Handle filter changes by updating URL params
  const handleSearchChange = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleCategoryChange = useCallback((categoryIds: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryIds.length > 0) {
      params.set('categories', categoryIds.join(','));
    } else {
      params.delete('categories');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleSortChange = useCallback((sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort && sort !== 'relevance') {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Explore Recipes</h1>
        <p className="text-muted-foreground mb-8">
          Discover delicious recipes from our community
        </p>

        <div className="mb-8">
          <SearchFilters 
            initialQuery={searchParams.get('q') || ''}
            initialCategories={searchParams.get('categories')?.split(',').map(Number).filter(n => !isNaN(n)) || []}
            initialSort={searchParams.get('sort') || 'relevance'}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onSortChange={handleSortChange}
          />
        </div>

        {loading && recipes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <RecipeGrid 
            initialRecipes={recipes}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Explore Recipes</h1>
          <p className="text-muted-foreground mb-8">
            Discover delicious recipes from our community
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}