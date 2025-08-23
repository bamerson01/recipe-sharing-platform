"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Bookmark, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { RecipeSummary } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function MyCookbookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [allRecipes, setAllRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    fetchAllRecipes();
  }, [user, router]);

  const fetchAllRecipes = async () => {
    try {
      setLoading(true);
      
      // Fetch both created and saved recipes in parallel
      const [createdResponse, savedResponse] = await Promise.all([
        fetch('/api/recipes/my'),
        fetch('/api/recipes/saved')
      ]);
      
      const createdData = createdResponse.ok ? await createdResponse.json() : { recipes: [] };
      const savedData = savedResponse.ok ? await savedResponse.json() : { recipes: [] };
      
      // Combine and deduplicate recipes (in case a user saved their own recipe)
      const createdRecipes = createdData.recipes || [];
      const savedRecipes = savedData.recipes || [];
      
      // Mark recipes as created by user or saved
      const markedCreated = createdRecipes.map(r => ({ ...r, isOwned: true }));
      const markedSaved = savedRecipes.map(r => ({ ...r, isOwned: false }));
      
      // Combine and deduplicate based on recipe ID
      const combinedMap = new Map();
      [...markedCreated, ...markedSaved].forEach(recipe => {
        if (!combinedMap.has(recipe.id) || recipe.isOwned) {
          combinedMap.set(recipe.id, recipe);
        }
      });
      
      setAllRecipes(Array.from(combinedMap.values()));
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = (id: number) => {
    router.push(`/recipes/edit/${id}`);
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchAllRecipes();
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleToggleVisibility = async (id: number, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/recipes/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !isPublic }),
      });
      
      if (response.ok) {
        fetchAllRecipes();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleSaveChange = (recipeId: number, saved: boolean) => {
    if (!saved) {
      setAllRecipes(prev => prev.map(r => 
        r.id === recipeId ? { ...r, is_saved: false } : r
      ));
    }
  };

  const filterRecipes = (recipes: RecipeSummary[]) => {
    let filtered = recipes;
    
    // Filter by tab
    if (activeTab === 'yours') {
      filtered = filtered.filter(r => r.isOwned);
    } else if (activeTab === 'others') {
      filtered = filtered.filter(r => !r.isOwned);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.summary?.toLowerCase().includes(query) ||
        recipe.categories.some(cat => cat.name.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const filteredRecipes = filterRecipes(allRecipes);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">My Cookbook</h1>
        <p className="text-muted-foreground mb-6">
          All your recipes in one place - created by you or saved for later
        </p>

        {/* Search Bar */}
        <div className="flex gap-4 items-center max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Recipe
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({allRecipes.length})
          </TabsTrigger>
          <TabsTrigger value="yours" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Yours ({allRecipes.filter(r => r.isOwned).length})
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Others ({allRecipes.filter(r => !r.isOwned).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[400px]" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No recipes found" : "No recipes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search" 
                    : "Start creating or saving recipes to build your cookbook"}
                </p>
                {!searchQuery && (
                  <div className="flex gap-4 justify-center">
                    <Button asChild>
                      <Link href="/recipes/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Recipe
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/recipes">
                        Browse Recipes
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  variant={recipe.isOwned ? "owner" : "default"}
                  onOpenModal={() => setSelectedRecipe(recipe)}
                  onEdit={recipe.isOwned ? handleEditRecipe : undefined}
                  onDelete={recipe.isOwned ? handleDeleteRecipe : undefined}
                  onToggleVisibility={recipe.isOwned ? handleToggleVisibility : undefined}
                  onSaveChange={!recipe.isOwned ? handleSaveChange : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="yours" className="space-y-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[400px]" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No recipes found" : "No recipes created yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search" 
                    : "Start creating your first recipe to share with the community"}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link href="/recipes/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Recipe
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  variant="owner"
                  onOpenModal={() => setSelectedRecipe(recipe)}
                  onEdit={handleEditRecipe}
                  onDelete={handleDeleteRecipe}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="others" className="space-y-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[400px]" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No saved recipes found" : "No saved recipes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search" 
                    : "Browse and save recipes you love to find them here"}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link href="/recipes">
                      Browse Recipes
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  onOpenModal={() => setSelectedRecipe(recipe)}
                  onSaveChange={handleSaveChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        recipeId={selectedRecipe?.id || null}
        variant={selectedRecipe?.isOwned ? "owner" : "default"}
        onEdit={selectedRecipe?.isOwned ? handleEditRecipe : undefined}
        onDelete={selectedRecipe?.isOwned ? handleDeleteRecipe : undefined}
        onToggleVisibility={selectedRecipe?.isOwned ? handleToggleVisibility : undefined}
        onSaveChange={!selectedRecipe?.isOwned ? handleSaveChange : undefined}
      />
    </div>
  );
}