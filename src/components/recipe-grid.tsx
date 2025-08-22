"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/search-filters";
import { fetchPublicRecipes } from "@/app/recipes/_actions/fetch-recipes";
import { useAuth } from "@/contexts/auth-context";

interface RecipeGridProps {
  initialQuery?: string;
  initialCategories?: number[];
  initialSort?: string;
}

export function RecipeGrid({
  initialQuery = "",
  initialCategories = [],
  initialSort = "relevance"
}: RecipeGridProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(initialCategories);
  const [sortBy, setSortBy] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch recipes with search and filters
  const loadRecipes = async (resetPage = false) => {
    try {
      const currentPage = resetPage ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }

      if (sortBy !== 'relevance') {
        params.append('sort', sortBy);
      }

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();

        if (resetPage) {
          setRecipes(data.recipes);
          setPage(1);
        } else {
          setRecipes(prev => [...prev, ...data.recipes]);
        }

        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when initial values change
  useEffect(() => {
    loadRecipes(true);
  }, [initialQuery, initialCategories, initialSort]);

  // Load more recipes
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadRecipes(false);
    }
  };

  // Search and filter handlers
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    loadRecipes(true);
  };

  const handleCategoryChange = (categoryIds: number[]) => {
    setSelectedCategories(categoryIds);
    loadRecipes(true);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    loadRecipes(true);
  };

  const handleViewRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading recipes...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No recipes found. Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <SearchFilters
        initialQuery={initialQuery}
        initialCategories={initialCategories}
        initialSort={initialSort}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.slug} onClick={() => handleViewRecipe(recipe)} className="cursor-pointer">
            <RecipeCard
              id={recipe.id}
              slug={recipe.slug}
              title={recipe.title}
              summary={recipe.summary}
              cover_image_key={recipe.cover_image_key}
              updated_at={recipe.updated_at}
              likeCount={recipe.like_count}
              authorName={recipe.author.display_name || 'Anonymous'}
              authorUsername={recipe.author.username}
              authorAvatar={recipe.author.avatar_key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.author.avatar_key}` : undefined}
              categories={recipe.categories}
              isLiked={recipe.isLiked}
              onOpenModal={() => handleViewRecipe(recipe)}
              disableNavigation={true}
            />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="px-8"
          >
            {loading ? 'Loading...' : 'Load More Recipes'}
          </Button>
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recipe={selectedRecipe}
        isOwner={false}
      />
    </>
  );
}
