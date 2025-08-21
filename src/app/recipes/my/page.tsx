"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Plus, Search, Edit, Trash2, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

interface Recipe {
  id: number;
  title: string;
  summary: string;
  isPublic: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  imagePath?: string;
  categories: Array<{ name: string; slug: string }>;
}

function MyRecipesDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Mock data - will be replaced with real API calls
  const mockRecipes: Recipe[] = [
    {
      id: 1,
      title: "Classic Chocolate Chip Cookies",
      summary: "The perfect chocolate chip cookie - crispy on the outside, chewy on the inside.",
      isPublic: true,
      likeCount: 127,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      imagePath: "/api/placeholder/400/300",
      categories: [{ name: "Dessert", slug: "dessert" }, { name: "Quick", slug: "quick" }],
    },
    {
      id: 2,
      title: "Vegan Buddha Bowl",
      summary: "A colorful and nutritious bowl packed with quinoa, roasted vegetables, and tahini dressing.",
      isPublic: false,
      likeCount: 0,
      createdAt: "2024-01-10T14:30:00Z",
      updatedAt: "2024-01-10T14:30:00Z",
      imagePath: "/api/placeholder/400/300",
      categories: [{ name: "Vegan", slug: "vegan" }, { name: "Lunch", slug: "lunch" }],
    },
  ];

  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "public" && recipe.isPublic) ||
      (statusFilter === "draft" && !recipe.isPublic);

    return matchesSearch && matchesStatus;
  });

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "most-liked":
        return b.likeCount - a.likeCount;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const handleDeleteRecipe = (recipeId: number) => {
    // TODO: Implement delete functionality
    console.log("Deleting recipe:", recipeId);
  };

  const handleToggleVisibility = (recipeId: number, currentStatus: boolean) => {
    // TODO: Implement visibility toggle
    console.log("Toggling visibility for recipe:", recipeId, "to:", !currentStatus);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (mockRecipes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <ChefHat className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-2">No Recipes Yet</h1>
            <p className="text-muted-foreground mb-6">
              Start your culinary journey by creating your first recipe
            </p>
            <Link href="/recipes/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Recipe
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Recipes</h1>
            <p className="text-muted-foreground">
              Manage and organize your culinary creations
            </p>
          </div>
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search your recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recipes</SelectItem>
                  <SelectItem value="public">Public Only</SelectItem>
                  <SelectItem value="draft">Drafts Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-liked">Most Liked</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Grid */}
        <div className="grid gap-6">
          {sortedRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Recipe Image */}
                <div className="md:w-48 md:h-32 h-48 md:h-auto relative">
                  {recipe.imagePath ? (
                    <img
                      src={recipe.imagePath}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={recipe.isPublic ? "default" : "secondary"}>
                      {recipe.isPublic ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Recipe Content */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold">{recipe.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVisibility(recipe.id, recipe.isPublic)}
                          >
                            {recipe.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Link href={`/recipes/${recipe.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {recipe.summary}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span>Created: {formatDate(recipe.createdAt)}</span>
                        <span>Updated: {formatDate(recipe.updatedAt)}</span>
                        <span>❤️ {recipe.likeCount} likes</span>
                      </div>

                      {recipe.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recipe.categories.map((category) => (
                            <Badge key={category.slug} variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex space-x-2">
                        <Link href={`/r/${recipe.id}`}>
                          <Button variant="outline" size="sm">
                            View Recipe
                          </Button>
                        </Link>
                        <Link href={`/recipes/${recipe.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedRecipes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find your recipes
              </p>
              <Link href="/recipes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Recipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
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
