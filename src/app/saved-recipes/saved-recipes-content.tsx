"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";

interface SavedRecipesContentProps {
  initialRecipes: any[];
  userId: string;
}

export function SavedRecipesContent({ initialRecipes, userId }: SavedRecipesContentProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={{
              ...recipe,
              is_saved: true, // All recipes here are saved
              author: recipe.author || {
                id: '',
                display_name: null,
                username: null,
                avatar_key: null
              }
            }}
            onOpenModal={() => handleViewRecipe(recipe)}
            onSaveChange={handleSaveChange}
          />
        ))}
      </div>

      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recipeId={selectedRecipe?.id || null}
        onSaveChange={(id, saved) => handleSaveChange(id, saved)}
      />
    </>
  );
}