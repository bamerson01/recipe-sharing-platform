"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { fetchPublicRecipes } from "@/app/recipes/_actions/fetch-recipes";

export function RecipeGrid() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch public recipes
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const result = await fetchPublicRecipes();
        if (result.ok) {
          setRecipes(result.recipes);
        }
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const handleLikeToggle = (recipeSlug: string) => {
    // TODO: Implement like toggle functionality
    console.log(`Toggle like for recipe ${recipeSlug}`);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.slug} onClick={() => handleViewRecipe(recipe)} className="cursor-pointer">
            <RecipeCard
              slug={recipe.slug}
              title={recipe.title}
              summary={recipe.summary}
              imagePath={recipe.cover_image_key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}` : undefined}
              likeCount={recipe.like_count}
              authorName={recipe.author.display_name || 'Anonymous'}
              categories={recipe.categories}
              isLiked={recipe.isLiked}
              onLikeToggle={() => handleLikeToggle(recipe.slug)}
              disableNavigation={true}
            />
          </div>
        ))}
      </div>

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
