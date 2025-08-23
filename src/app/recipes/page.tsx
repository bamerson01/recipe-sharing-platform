"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchFilters } from "@/components/search-filters";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  TrendingUp,
  Clock,
  Users,
  Search,
  Loader2,
  ChefHat
} from "lucide-react";
import type { RecipeSummary } from "@/types/recipe";

function RecipesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'explore');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [followingRecipes, setFollowingRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load recipes based on active tab and filters
  useEffect(() => {
    loadRecipes();
  }, [activeTab, searchParams, user]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'following' && user) {
        // Load following feed
        const response = await fetch('/api/feed/following');
        if (response.ok) {
          const data = await response.json();
          setFollowingRecipes(data.recipes || []);
        }
      } else {
        // Load public recipes based on tab
        const params = new URLSearchParams({
          page: '1',
          limit: '20'
        });

        // Add search and filter params
        const query = searchParams.get('q');
        const categories = searchParams.get('categories');

        if (query) params.append('q', query);
        if (categories) params.append('categories', categories);

        // Set sort based on tab
        if (activeTab === 'popular') {
          params.append('sort', 'popular');
        } else if (activeTab === 'recent') {
          params.append('sort', 'recent');
        }

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();

        setRecipes(data.recipes || []);
        setPage(2);
        setHasMore(data.recipes && data.recipes.length === 20);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
      setRecipes([]);
      setFollowingRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchParams, user]);

  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      const query = searchParams.get('q');
      const categories = searchParams.get('categories');

      if (query) params.append('q', query);
      if (categories) params.append('categories', categories);

      if (activeTab === 'popular') {
        params.append('sort', 'popular');
      } else if (activeTab === 'recent') {
        params.append('sort', 'recent');
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      setRecipes(prev => [...prev, ...(data.recipes || [])]);
      setPage(page + 1);
      setHasMore(data.recipes && data.recipes.length === 20);
    } catch (error) {
      console.error('Failed to load more recipes:', error);
      setHasMore(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

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

  const handleViewRecipe = (recipe: RecipeSummary) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const currentRecipes = activeTab === 'following' ? followingRecipes : recipes;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Recipes</h1>
        <p className="text-muted-foreground">
          Find your next favorite dish from our community
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilters
          initialQuery={searchParams.get('q') || ''}
          initialCategories={searchParams.get('categories')?.split(',').map(Number).filter(n => !isNaN(n)) || []}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Explore</span>
          </TabsTrigger>
          {user && (
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Popular</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Recent</span>
          </TabsTrigger>
        </TabsList>

        {/* Content for each tab */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : currentRecipes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'following' ? 'No recipes from people you follow' : 'No recipes found'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === 'following'
                    ? 'Follow users to see their recipes here'
                    : 'Try adjusting your search or filters'}
                </p>
                {activeTab === 'following' && (
                  <Button onClick={() => setActiveTab('explore')}>
                    Explore Recipes
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onOpenModal={() => handleViewRecipe(recipe)}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && activeTab !== 'following' && (
                <div className="mt-8 text-center">
                  <Button onClick={loadMore} variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recipeId={selectedRecipe?.id || null}
      />
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Recipes</h1>
          <p className="text-muted-foreground">
            Find your next favorite dish from our community
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}