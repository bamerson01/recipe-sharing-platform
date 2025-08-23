"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { Users, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Recipe {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  like_count: number;
  is_public: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  prep_time?: number | null;
  cook_time?: number | null;
  created_at: string;
  updated_at?: string;
  author?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_key?: string | null;
  };
  categories: Array<{ id: number; name: string; slug: string }>;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [followingRecipes, setFollowingRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("following");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeedData();
    } else {
      // Load public feeds even when not logged in
      loadPublicFeeds();
    }
  }, [user]);

  const loadFeedData = async () => {
    try {
      setLoading(true);

      // Load following feed
      const followingResponse = await fetch('/api/feed/following');
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowingRecipes(followingData.recipes || []);
      }

      // Load popular and recent feeds
      await loadPublicFeeds();
    } catch (error) {      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const loadPublicFeeds = async () => {
    try {
      // Load popular recipes
      const popularResponse = await fetch('/api/feed/popular');
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        setPopularRecipes(popularData.recipes || []);
      }

      // Load recent recipes
      const recentResponse = await fetch('/api/feed/recent');
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentRecipes(recentData.recipes || []);
      }
    } catch (error) {    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-8">
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign in to see your personalized feed</h2>
            <p className="text-muted-foreground mb-4">
              Follow users to see their latest recipes in your feed
            </p>
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Show popular recipes for non-authenticated users */}
        <Tabs value="popular" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : (
              <RecipeGrid recipes={popularRecipes} onViewRecipe={handleViewRecipe} />
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : (
              <RecipeGrid recipes={recentRecipes} onViewRecipe={handleViewRecipe} />
            )}
          </TabsContent>
        </Tabs>

        <RecipeDetailModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          recipeId={selectedRecipe?.id || null}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Feed</h1>
        <p className="text-muted-foreground">
          Discover recipes from people you follow and trending content
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : followingRecipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No recipes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Follow users to see their recipes here
                </p>
                <Link href="/explore">
                  <Button>Discover Users</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <RecipeGrid recipes={followingRecipes} onViewRecipe={handleViewRecipe} />
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : (
            <RecipeGrid recipes={popularRecipes} onViewRecipe={handleViewRecipe} />
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : (
            <RecipeGrid recipes={recentRecipes} onViewRecipe={handleViewRecipe} />
          )}
        </TabsContent>
      </Tabs>

      <RecipeDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recipeId={selectedRecipe?.id || null}
      />
    </div>
  );
}

function RecipeGrid({
  recipes,
  onViewRecipe
}: {
  recipes: Recipe[];
  onViewRecipe: (recipe: Recipe) => void;
}) {
  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No recipes to show</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={{
            ...recipe,
            updated_at: recipe.updated_at || recipe.created_at,
            difficulty: recipe.difficulty || null,
            prep_time: recipe.prep_time || null,
            cook_time: recipe.cook_time || null,
            author: recipe.author ? {
              id: recipe.author.id || '',
              display_name: recipe.author.display_name || null,
              username: recipe.author.username || null,
              avatar_key: recipe.author.avatar_key || null
            } : {
              id: '',
              display_name: null,
              username: null,
              avatar_key: null
            },
            is_public: recipe.is_public
          }}
          onOpenModal={() => onViewRecipe(recipe)}
        />
      ))}
    </div>
  );
}