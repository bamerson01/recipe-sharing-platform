"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ChefHat } from "lucide-react";
import Link from "next/link";
import { getWhoLikedMyRecipes } from "@/app/_actions/track-interactions";
import { imageSrcFromKey } from "@/lib/images/url";
import { formatDistanceToNow } from "date-fns";

interface LikeInteraction {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  recipe_id: number;
  recipe_title: string;
  recipe_slug: string;
  liked_at: string;
}

export function LikesInteractionsList() {
  const [likes, setLikes] = useState<LikeInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLikes();
  }, []);

  const loadLikes = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const result = await getWhoLikedMyRecipes(pageNum, 20);

      if (result.success && result.likes) {
        if (pageNum === 1) {
          setLikes(result.likes);
        } else {
          setLikes(prev => [...prev, ...result.likes]);
        }
        setHasMore(result.likes.length === 20);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to load likes');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLikes(page + 1);
    }
  };

  if (loading && likes.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center space-x-4 p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>...</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Unable to load recipe likes
          </p>
          <Button onClick={() => loadLikes(1)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (likes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No likes yet</h3>
          <p className="text-muted-foreground mb-4">
            When people like your recipes, they'll appear here
          </p>
          <Button asChild>
            <Link href="/recipes/new">
              <ChefHat className="mr-2 h-4 w-4" />
              Create Recipe
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {likes.map((like) => (
        <Card key={`${like.id}-${like.recipe_id}`}>
          <CardContent className="flex items-center space-x-4 p-4">
            <Link href={`/u/${like.username}`} className="flex-shrink-0">
              <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                <AvatarImage
                  src={like.avatar_key ? imageSrcFromKey(like.avatar_key) || undefined : undefined}
                  alt={like.display_name || like.username}
                />
                <AvatarFallback>
                  {(like.display_name || like.username)?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/u/${like.username}`} className="hover:underline">
                  <span className="font-medium">
                    {like.display_name || like.username}
                  </span>
                </Link>
                <span className="text-muted-foreground">liked</span>
                <Link href={`/r/${like.recipe_id}-${like.recipe_slug}`} className="hover:underline">
                  <span className="font-medium text-primary">
                    {like.recipe_title}
                  </span>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(like.liked_at), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
