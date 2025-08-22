"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { Button } from "@/components/ui/button";
import type { RecipeSummary } from "@/types/recipe";

interface RecipeGridProps {
  initialRecipes: RecipeSummary[];
  variant?: 'default' | 'owner';
  hasMore?: boolean;
  onLoadMore?: () => Promise<{ recipes: RecipeSummary[]; hasMore: boolean }>;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => Promise<void>;
  onToggleVisibility?: (id: number, isPublic: boolean) => Promise<void>;
  emptyMessage?: string;
}

export function RecipeGrid({
  initialRecipes,
  variant = 'default',
  hasMore: initialHasMore = false,
  onLoadMore,
  onEdit,
  onDelete,
  onToggleVisibility,
  emptyMessage = "No recipes found"
}: RecipeGridProps) {
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (recipe: RecipeSummary) => {
    setSelectedRecipeId(recipe.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipeId(null);
  };

  const handleLoadMore = async () => {
    if (!onLoadMore || loading) return;
    
    setLoading(true);
    try {
      const result = await onLoadMore();
      setRecipes(prev => [...prev, ...result.recipes]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!onDelete) return;
    await onDelete(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleVisibility = async (id: number, isPublic: boolean) => {
    if (!onToggleVisibility) return;
    await onToggleVisibility(id, isPublic);
    setRecipes(prev => prev.map(r => 
      r.id === id ? { ...r, is_public: !isPublic } : r
    ));
  };

  const handleSaveChange = (id: number, saved: boolean) => {
    setRecipes(prev => prev.map(r => 
      r.id === id ? { ...r, is_saved: saved } : r
    ));
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            variant={variant}
            onOpenModal={handleOpenModal}
            onEdit={onEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
            onSaveChange={handleSaveChange}
          />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="text-center mt-8">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            className="px-8"
          >
            {loading ? 'Loading...' : 'Load More Recipes'}
          </Button>
        </div>
      )}

      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        recipeId={selectedRecipeId}
        variant={variant}
        onEdit={onEdit}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onSaveChange={handleSaveChange}
      />
    </>
  );
}