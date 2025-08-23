"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ChefHat } from "lucide-react";
import Link from "next/link";
import { getWhoCommentedOnMyRecipes } from "@/app/_actions/track-interactions";
import { imageSrcFromKey } from "@/lib/images/url";
import { formatDistanceToNow } from "date-fns";

interface CommentInteraction {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  recipe_id: number;
  recipe_title: string;
  recipe_slug: string;
  comment_body: string;
  comment_excerpt: string;
  commented_at: string;
}

export function CommentsInteractionsList() {
  const [comments, setComments] = useState<CommentInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const result = await getWhoCommentedOnMyRecipes(pageNum, 20);

      if (result.success && result.comments) {
        if (pageNum === 1) {
          setComments(result.comments);
        } else {
          setComments(prev => [...prev, ...result.comments]);
        }
        setHasMore(result.comments.length === 20);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start space-x-4 p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>...</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
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
            Unable to load recipe comments
          </p>
          <Button onClick={() => loadComments(1)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No comments yet</h3>
          <p className="text-muted-foreground mb-4">
            When people comment on your recipes, they'll appear here
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
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardContent className="flex items-start space-x-4 p-4">
            <Link href={`/u/${comment.username}`} className="flex-shrink-0">
              <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                <AvatarImage
                  src={comment.avatar_key ? imageSrcFromKey(comment.avatar_key) || undefined : undefined}
                  alt={comment.display_name || comment.username}
                />
                <AvatarFallback>
                  {(comment.display_name || comment.username)?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/u/${comment.username}`} className="hover:underline">
                  <span className="font-medium">
                    {comment.display_name || comment.username}
                  </span>
                </Link>
                <span className="text-muted-foreground">commented on</span>
                <Link href={`/r/${comment.recipe_id}-${comment.recipe_slug}`} className="hover:underline">
                  <span className="font-medium text-primary">
                    {comment.recipe_title}
                  </span>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {comment.comment_excerpt}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.commented_at), { addSuffix: true })}
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
