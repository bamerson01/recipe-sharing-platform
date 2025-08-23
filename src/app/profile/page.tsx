"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChefHat,
  Edit,
  Settings,
  BookOpen,
  Heart,
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useState, useEffect } from "react";
import { getStorageUrl } from "@/lib/storage-utils";
import { fetchUserRecipes, RecipeWithDetails } from "@/app/recipes/_actions/fetch-recipes";
import { deleteRecipe, toggleRecipeVisibility } from "@/app/recipes/_actions/manage-recipes";
import { getUserSavedRecipes } from "@/app/recipes/_actions/manage-saves";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { imageSrcFromKey } from "@/lib/images/url";

function ProfileContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("recipes");
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch profile data
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData.profile);
        }

        // Fetch user's recipes
        const recipesResult = await fetchUserRecipes(user.id);
        if (recipesResult.ok) {
          setRecipes(recipesResult.recipes);
          setFilteredRecipes(recipesResult.recipes);
        }

        // Fetch saved recipes
        const savedResult = await getUserSavedRecipes(user.id, 50);
        if (savedResult.success && savedResult.recipes) {
          setSavedRecipes(savedResult.recipes);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Apply filters and search to recipes
  useEffect(() => {
    if (activeTab !== "recipes") return;

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
  }, [recipes, searchQuery, statusFilter, sortBy, activeTab]);

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

  const handleSaveChange = (recipeId: number, saved: boolean) => {
    if (!saved && activeTab === "saved") {
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
  };

  const stats = {
    recipes: recipes.length,
    saved: savedRecipes.length,
    likes: recipes.reduce((sum, r) => sum + r.like_count, 0)
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24" tabIndex={-1}>
                <AvatarImage src={profile?.avatar_key ? getStorageUrl(profile.avatar_key) : user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">
                  {profile?.display_name || user?.user_metadata?.full_name || 'Chef'}
                </h1>
                <p className="text-muted-foreground">
                  @{profile?.username || 'username'} · Member since {user ? new Date(user.created_at).toLocaleDateString() : ''}
                </p>

                {/* Stats */}
                <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                  <div>
                    <span className="font-bold">{stats.recipes}</span>
                    <span className="text-muted-foreground ml-1">recipes</span>
                  </div>
                  <div>
                    <span className="font-bold">{stats.saved}</span>
                    <span className="text-muted-foreground ml-1">saved</span>
                  </div>
                  <div>
                    <span className="font-bold">{stats.likes}</span>
                    <span className="text-muted-foreground ml-1">likes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/recipes/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Recipe
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipes">My Recipes ({recipes.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedRecipes.length})</TabsTrigger>
          </TabsList>

          {/* My Recipes Tab */}
          <TabsContent value="recipes" className="space-y-6">
            {/* Filters */}
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

            {/* Recipes Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredRecipes.length === 0 ? (
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
                        display_name: profile?.display_name || null,
                        username: profile?.username || null,
                        avatar_key: profile?.avatar_key || null
                      }
                    }}
                    variant="owner"
                    onOpenModal={() => handleViewRecipe(recipe)}
                    onEdit={(id) => window.location.href = `/recipes/edit/${id}`}
                    onDelete={handleDeleteRecipe}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Recipes Tab */}
          <TabsContent value="saved" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : savedRecipes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No saved recipes yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start exploring and save recipes you want to try later
                  </p>
                  <Link href="/discover">
                    <Button>Explore Recipes</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={{
                      ...recipe,
                      is_saved: true
                    }}
                    onOpenModal={() => handleViewRecipe(recipe)}
                    onSaveChange={handleSaveChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recipe Detail Modal */}
        <RecipeDetailModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          recipeId={selectedRecipe?.id || null}
          variant={activeTab === "recipes" ? "owner" : undefined}
          onEdit={(id) => {
            window.location.href = `/recipes/edit/${id}`;
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
          onSaveChange={handleSaveChange}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}