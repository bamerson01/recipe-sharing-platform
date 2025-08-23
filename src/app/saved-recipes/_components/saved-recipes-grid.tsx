"use client";

import { useState } from "react";
import { RecipeSummary } from "@/types/recipe";
import { RecipeCard } from "@/components/recipe-card-unified";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

interface SavedRecipesGridProps {
  initialRecipes: RecipeSummary[];
}

export function SavedRecipesGrid({ initialRecipes }: SavedRecipesGridProps) {
  const [recipes] = useState<RecipeSummary[]>(initialRecipes);

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No saved recipes yet</h3>
        <p className="text-muted-foreground mb-4">
          Start exploring recipes and save the ones you&apos;d like to try later
        </p>
        <Button asChild>
          <a href="/recipes">Browse Recipes</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
