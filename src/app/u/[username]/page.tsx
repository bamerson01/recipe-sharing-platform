"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChefHat, Heart, Calendar, Loader2 } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import { fetchUserRecipes } from "@/app/recipes/_actions/fetch-recipes";
import { fetchUserLikedRecipes } from "@/app/recipes/_actions/fetch-recipes";
import { fetchUserProfile } from "@/app/recipes/_actions/fetch-recipes";

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Recipe {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  like_count: number;
  is_public: boolean;
  created_at: string;
  categories: Array<{ id: number; name: string; slug: string }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recipes");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);

        // Load user profile
        const profileResult = await fetchUserProfile(username);
        if (profileResult.ok) {
          setProfile(profileResult.profile);

          // Load user's recipes
          const recipesResult = await fetchUserRecipes(profileResult.profile.id);
          if (recipesResult.ok) {
            setRecipes(recipesResult.recipes);
          }

          // Load user's liked recipes
          const likedResult = await fetchUserLikedRecipes(profileResult.profile.id);
          if (likedResult.ok) {
            setLikedRecipes(likedResult.recipes);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [username]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-destructive">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.charAt(0).toUpperCase() || profile.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl">
            {profile.display_name || profile.username || 'Anonymous User'}
          </CardTitle>
          {profile.bio && (
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              {profile.bio}
            </p>
          )}
          <CardDescription>
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipes.length}</div>
              <div className="text-sm text-muted-foreground">Recipes Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{likedRecipes.length}</div>
              <div className="text-sm text-muted-foreground">Recipes Liked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Recipes ({recipes.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({likedRecipes.length})
          </TabsTrigger>
        </TabsList>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-6">
          {recipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No recipes yet</h3>
                <p className="text-muted-foreground">
                  This user hasn't created any recipes yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.slug}
                  slug={recipe.slug}
                  title={recipe.title}
                  summary={recipe.summary}
                  imagePath={recipe.cover_image_key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}` : undefined}
                  likeCount={recipe.like_count}
                  authorName={profile.display_name || profile.username || 'Anonymous'}
                  categories={recipe.categories}
                  disableNavigation={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Liked Recipes Tab */}
        <TabsContent value="liked" className="space-y-6">
          {likedRecipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No liked recipes yet</h3>
                <p className="text-muted-foreground">
                  This user hasn't liked any recipes yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.slug}
                  slug={recipe.slug}
                  title={recipe.title}
                  summary={recipe.summary}
                  imagePath={recipe.cover_image_key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}` : undefined}
                  likeCount={recipe.like_count}
                  authorName={recipe.author?.display_name || recipe.author?.username || 'Anonymous'}
                  categories={recipe.categories}
                  disableNavigation={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
