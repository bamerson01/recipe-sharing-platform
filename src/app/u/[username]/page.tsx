"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChefHat, Heart, Users } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card-unified";
import { RecipeDetailModal } from "@/components/recipe-detail-modal-unified";
import { FollowButton } from "@/components/follow-button";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchUserRecipes } from "@/app/recipes/_actions/fetch-recipes";
import { fetchUserLikedRecipes } from "@/app/recipes/_actions/fetch-recipes";
import { fetchUserProfile } from "@/app/recipes/_actions/fetch-recipes";
import { getStorageUrl } from "@/lib/storage-utils";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
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
  ingredients?: Array<{ id: number; position: number; text: string }>;
  steps?: Array<{ id: number; position: number; text: string }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recipes");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);

        // Load user profile first to get the user ID
        const profileResult = await fetchUserProfile(username);
        if (profileResult.ok && profileResult.profile) {
          const profileData = profileResult.profile as any;
          const userId = profileData.id;
          
          // Set profile immediately
          setProfile({
            id: userId,
            username: profileData.username,
            display_name: profileData.display_name,
            avatar_key: profileData.avatar_key,
            bio: profileData.bio,
            follower_count: profileData.follower_count || 0,
            following_count: profileData.following_count || 0,
            created_at: profileData.created_at
          });
          setFollowerCount(profileData.follower_count || 0);
          setFollowingCount(profileData.following_count || 0);

          // Load recipes and liked recipes in parallel
          const [recipesResult, likedResult] = await Promise.all([
            fetchUserRecipes(userId),
            fetchUserLikedRecipes(userId)
          ]);

          if (recipesResult.ok) {
            setRecipes(recipesResult.recipes as Recipe[]);
          }

          if (likedResult.ok) {
            setLikedRecipes(likedResult.recipes as Recipe[]);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading user data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [username]);

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading profile..." />
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
            <Avatar className="h-24 w-24" tabIndex={-1}>
              <AvatarImage src={profile.avatar_key ? getStorageUrl(profile.avatar_key) || undefined : undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.charAt(0).toUpperCase() || profile.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl">
            {profile.display_name || profile.username || 'Anonymous User'}
          </CardTitle>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              {profile.bio}
            </p>
          )}
          <div className="mt-4">
            {user && user.id !== profile.id && (
              <FollowButton
                username={profile.username || ''}
                userId={profile.id}
                onFollowChange={(isFollowing) => {
                  setFollowerCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
                }}
              />
            )}
          </div>
          <CardDescription className="mt-4">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipes.length}</div>
              <div className="text-sm text-muted-foreground">Recipes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{likedRecipes.length}</div>
              <div className="text-sm text-muted-foreground">Liked</div>
            </div>
            <Link href={`/u/${username}/followers`} className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-2xl font-bold text-primary">{followerCount}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </Link>
            <Link href={`/u/${username}/following`} className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-2xl font-bold text-primary">{followingCount}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </Link>
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
                  This user hasn&apos;t created any recipes yet.
                </p>
              </CardContent>
            </Card>
          ) : (
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
                    author: {
                      id: profile?.id || '',
                      display_name: profile?.display_name || null,
                      username: profile?.username || null,
                      avatar_key: profile?.avatar_key || null
                    },
                    is_public: recipe.is_public
                  }}
                  onOpenModal={() => handleViewRecipe(recipe)}
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
                  This user hasn&apos;t liked any recipes yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={{
                    ...recipe,
                    updated_at: recipe.updated_at || recipe.created_at,
                    difficulty: recipe.difficulty || null,
                    prep_time: recipe.prep_time || null,
                    cook_time: recipe.cook_time || null,
                    like_count: recipe.like_count,
                    is_public: recipe.is_public,
                    author: {
                      id: recipe.author?.id || '',
                      display_name: recipe.author?.display_name || null,
                      username: recipe.author?.username || null,
                      avatar_key: recipe.author?.avatar_key || null
                    }
                  }}
                  onOpenModal={() => handleViewRecipe(recipe)}
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
      />
    </div>
  );
}
