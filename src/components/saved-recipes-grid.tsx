"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { getUserSavedRecipes } from "@/app/recipes/_actions/manage-saves";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Bookmark, ChefHat } from "lucide-react";

export function SavedRecipesGrid() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch saved recipes
  useEffect(() => {
    const loadSavedRecipes = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getUserSavedRecipes(user.id);
        if (result.success && result.recipes) {
          setRecipes(result.recipes);
        }
      } catch (error) {
        console.error('Error loading saved recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedRecipes();
  }, [user]);

  const handleViewRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const handleSaveChange = (recipeId: number, saved: boolean) => {
    if (!saved) {
      // Remove recipe from the list if unsaved
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign in to view saved recipes</h3>
        <p className="text-muted-foreground mb-4">
          Create an account to save recipes and access them later
        </p>
        <Button asChild>
          <a href="/auth">Sign In</a>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading saved recipes...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved recipes yet</h3>
        <p className="text-muted-foreground mb-4">
          Start exploring recipes and save the ones you want to try later
        </p>
        <Button asChild>
          <a href="/explore">Explore Recipes</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={{
              ...recipe,
              like_count: recipe.like_count,
              is_public: recipe.is_public || true,
              is_saved: true, // Mark all recipes as saved since they're in the saved list
              author: recipe.author || {
                id: '',
                display_name: null,
                username: null,
                avatar_key: null
              }
            }}
            onOpenModal={() => handleViewRecipe(recipe)}
          />
        ))}
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recipeId={selectedRecipe?.id || null}
        onSaveChange={(id, saved) => handleSaveChange(id, saved)}
      />
    </>
  );
}
