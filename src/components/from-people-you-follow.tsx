"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, ChefHat } from "lucide-react";
import Link from "next/link";
import { getRecentFromFollowing } from "@/app/_actions/manage-follows";
import { imageSrcFromKey } from "@/lib/images/url";
import { formatDistanceToNow } from "date-fns";

interface RecipeFromFollowing {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  like_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_key: string | null;
  };
}

export function FromPeopleYouFollow() {
  const [recipes, setRecipes] = useState<RecipeFromFollowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const result = await getRecentFromFollowing(1, 5);

        if (result.success && result.recipes) {
          setRecipes(result.recipes);
        } else {
          setError(result.error || 'Failed to load recipes');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>From People You Follow</CardTitle>
            <Button variant="ghost" size="sm" disabled>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>From People You Follow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Unable to load recipes from people you follow
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recipes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>From People You Follow</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/discover">
                Discover Creators <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">You&apos;re not following anyone yet</h3>
            <p className="text-muted-foreground mb-4">
              Start following creators to see their latest recipes here
            </p>
            <Button asChild>
              <Link href="/discover">
                <ChefHat className="mr-2 h-4 w-4" />
                Discover Creators
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>From People You Follow</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">
              Discover More <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="flex items-center space-x-4">
              <div className="relative h-16 w-16 flex-shrink-0">
                {recipe.cover_image_key ? (
                  <img
                    src={imageSrcFromKey(recipe.cover_image_key) || ''}
                    alt={recipe.title}
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-md bg-muted flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/r/${recipe.id}-${recipe.slug}`} className="hover:underline">
                  <p className="text-sm font-medium truncate">{recipe.title}</p>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Link href={`/u/${recipe.author.username}`} className="flex items-center gap-2 hover:opacity-80">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={recipe.author.avatar_key ? imageSrcFromKey(recipe.author.avatar_key) || undefined : undefined}
                        alt={recipe.author.display_name || recipe.author.username}
                      />
                      <AvatarFallback className="text-xs">
                        {(recipe.author.display_name || recipe.author.username)?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {recipe.author.display_name || recipe.author.username}
                    </span>
                  </Link>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/r/${recipe.id}-${recipe.slug}`}>
                  View
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
