"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Plus, Search, Edit, Trash2, Eye, EyeOff, MoreHorizontal, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { fetchUserRecipes, RecipeWithDetails } from "../_actions/fetch-recipes";
import { deleteRecipe, toggleRecipeVisibility } from "../_actions/manage-recipes";
import { fetchCategories, Category } from "../_actions/categories";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";

function MyRecipesDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check for success message from URL
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'created') {
      setSuccessMessage('Recipe created successfully! 🎉');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [searchParams]);

  // Fetch recipes and categories
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const [recipesResult, categoriesResult] = await Promise.all([
          fetchUserRecipes(user.id),
          fetchCategories()
        ]);

        if (recipesResult.ok) {
          setRecipes(recipesResult.recipes);
          setFilteredRecipes(recipesResult.recipes);
        }

        if (categoriesResult.ok) {
          setCategories(categoriesResult.categories);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Apply filters and search
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
        recipe.summary?.toLowerCase().includes(query) ||
        recipe.categories.some(cat => cat.name.toLowerCase().includes(query))
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
      } else {
        alert(result.message || 'Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (recipeId: number, currentStatus: boolean) => {
    setActionLoading(recipeId);
    try {
      const result = await toggleRecipeVisibility(recipeId);
      if (result.ok) {
        setRecipes(prev => prev.map(r =>
          r.id === recipeId ? { ...r, is_public: result.isPublic! } : r
        ));
        setSuccessMessage(result.message);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        alert(result.message || 'Failed to update recipe');
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;

    // For now, return a placeholder. In production, you'd construct the Supabase Storage URL
    return `https://via.placeholder.com/400x300?text=Recipe+Image`;
  };

  const handleViewRecipe = (recipe: RecipeWithDetails) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleEditRecipe = (recipe: RecipeWithDetails) => {
    window.location.href = `/recipes/edit/${recipe.id}`;
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Recipes</h1>
          <p className="text-muted-foreground">
            Manage and organize your culinary creations
          </p>
        </div>
        <Link href="/recipes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Recipe
          </Button>
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
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
            <SelectItem value="draft">Drafts</SelectItem>
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

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden">
              {/* Recipe Image */}
              <div
                className="aspect-[4/3] bg-muted relative cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleViewRecipe(recipe)}
              >
                {recipe.cover_image_key ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}`}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant={recipe.is_public ? "default" : "secondary"}>
                    {recipe.is_public ? "Public" : "Draft"}
                  </Badge>
                </div>

                {/* Click to View Overlay */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="bg-white/90 rounded-full p-2">
                    <Eye className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Recipe Title and Summary */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1 cursor-pointer hover:text-primary transition-colors" onClick={() => handleViewRecipe(recipe)}>
                    {recipe.title}
                  </h3>
                  {recipe.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {recipe.summary}
                    </p>
                  )}
                </div>

                {/* Categories */}
                {recipe.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {recipe.categories.slice(0, 3).map((category) => (
                      <Badge key={category.id} variant="outline" className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                    {recipe.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{recipe.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Recipe Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>❤️ {recipe.like_count} likes</span>
                  <span>{formatDate(recipe.created_at)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVisibility(recipe.id, recipe.is_public)}
                    disabled={actionLoading === recipe.id}
                    className="flex-1"
                  >
                    {actionLoading === recipe.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : recipe.is_public ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Make Public
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRecipe(recipe)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    disabled={actionLoading === recipe.id}
                  >
                    {actionLoading === recipe.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Count */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Showing {filteredRecipes.length} of {recipes.length} recipes
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recipe={selectedRecipe}
        isOwner={true}
        onEdit={() => {
          if (selectedRecipe) {
            handleEditRecipe(selectedRecipe);
            handleModalClose();
          }
        }}
        onDelete={() => {
          if (selectedRecipe) {
            handleDeleteRecipe(selectedRecipe.id);
            handleModalClose();
          }
        }}
        onToggleVisibility={() => {
          if (selectedRecipe) {
            handleToggleVisibility(selectedRecipe.id, selectedRecipe.is_public);
            handleModalClose();
          }
        }}
      />
    </div>
  );
}

export default function MyRecipesPage() {
  return (
    <ProtectedRoute>
      <MyRecipesDashboard />
    </ProtectedRoute>
  );
}
