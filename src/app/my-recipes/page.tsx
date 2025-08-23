"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChefHat,
  Plus,
  Search,
  Trash2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchUserRecipes, RecipeWithDetails } from "@/app/recipes/_actions/fetch-recipes";
import { deleteRecipe, toggleRecipeVisibility } from "@/app/recipes/_actions/manage-recipes";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";

function MyRecipesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user's recipes
  useEffect(() => {
    const loadRecipes = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const recipesResult = await fetchUserRecipes(user.id);
        if (recipesResult.ok) {
          setRecipes(recipesResult.recipes);
          setFilteredRecipes(recipesResult.recipes);
        }
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [user]);

  // Apply filters and search to recipes
  useEffect(() => {
    let filtered = [...recipes];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(recipe =>
        statusFilter === "public" ? recipe.is_public : !recipe.is_public
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.summary?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most-liked":
          return b.like_count - a.like_count;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredRecipes(filtered);
  }, [recipes, searchQuery, statusFilter, sortBy]);

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    setActionLoading(recipeId);
    try {
      const result = await deleteRecipe(recipeId);
      if (result.ok) {
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        setSuccessMessage('Recipe deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (recipeId: number) => {
    setActionLoading(recipeId);
    try {
      const result = await toggleRecipeVisibility(recipeId);
      if (result.ok) {
        setRecipes(prev => prev.map(r =>
          r.id === recipeId ? { ...r, is_public: result.isPublic! } : r
        ));
        setSuccessMessage(result.message);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    } finally {
      setActionLoading(null);
    }
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
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Recipes</h1>
            <p className="text-muted-foreground">
              Manage and organize your recipe collection
            </p>
          </div>
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Recipe
            </Button>
          </Link>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recipes</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-liked">Most Liked</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {recipes.length === 0 ? "No recipes yet" : "No recipes match your filters"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {recipes.length === 0
                  ? "Create your first recipe to get started!"
                  : "Try adjusting your search or filters"
                }
              </p>
              {recipes.length === 0 && (
                <Link href="/recipes/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Recipe
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  difficulty: (recipe as any).difficulty || null,
                  prep_time: (recipe as any).prep_time || null,
                  cook_time: (recipe as any).cook_time || null,
                  author: {
                    id: user?.id || '',
                    display_name: user?.user_metadata?.full_name || null,
                    username: user?.email?.split('@')[0] || null,
                    avatar_key: null
                  }
                }}
                variant="owner"
                onOpenModal={() => handleViewRecipe(recipe)}
                onEdit={(id) => router.push(`/recipes/edit/${id}`)}
                onDelete={handleDeleteRecipe}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        )}

        {/* Recipe Detail Modal */}
        <RecipeDetailModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          recipeId={selectedRecipe?.id || null}
          variant="owner"
          onEdit={(id) => {
            router.push(`/recipes/edit/${id}`);
            handleModalClose();
          }}
          onDelete={(id) => {
            handleDeleteRecipe(id);
            handleModalClose();
          }}
          onToggleVisibility={(id, isPublic) => {
            handleToggleVisibility(id);
            handleModalClose();
          }}
        />
      </div>
    </div>
  );
}

export default function MyRecipesPage() {
  return (
    <ProtectedRoute>
      <MyRecipesContent />
    </ProtectedRoute>
  );
}
