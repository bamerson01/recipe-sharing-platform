"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ChefHat } from "lucide-react";
import Link from "next/link";
import { getFollowing, unfollowUser } from "@/app/_actions/manage-follows";
import { imageSrcFromKey } from "@/lib/images/url";
import { formatDistanceToNow } from "date-fns";

interface Following {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  followed_at: string;
}

interface FollowingListProps {
  userId: string;
}

export function FollowingList({ userId }: FollowingListProps) {
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unfollowingStates, setUnfollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const loadFollowing = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const result = await getFollowing(userId, pageNum, 20);

      if (result.success && result.following) {
        if (pageNum === 1) {
          setFollowing(result.following);
        } else {
          setFollowing(prev => [...prev, ...result.following]);
        }
        setHasMore(result.following.length === 20);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to load following');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFollowing(page + 1);
    }
  };

  const handleUnfollow = async (followingId: string) => {
    try {
      setUnfollowingStates(prev => ({ ...prev, [followingId]: true }));

      const result = await unfollowUser(followingId);

      if (result.success) {
        // Remove from the list
        setFollowing(prev => prev.filter(f => f.id !== followingId));
      } else {
        console.error('Failed to unfollow:', result.error);
        setUnfollowingStates(prev => ({ ...prev, [followingId]: false }));
      }
    } catch (error) {
      console.error('Error unfollowing:', error);
      setUnfollowingStates(prev => ({ ...prev, [followingId]: false }));
    }
  };

  if (loading && following.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>...</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
              <div className="h-9 w-24 bg-muted rounded" />
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
            Unable to load following
          </p>
          <Button onClick={() => loadFollowing(1)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (following.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">You&apos;re not following anyone yet</h3>
          <p className="text-muted-foreground mb-4">
            Start following creators to see their latest recipes on your dashboard
          </p>
          <Button asChild>
            <Link href="/recipes">
              <ChefHat className="mr-2 h-4 w-4" />
              Explore Creators
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {following.map((followed) => (
        <Card key={followed.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Link href={`/u/${followed.username}`} className="flex-shrink-0">
                <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src={followed.avatar_key ? imageSrcFromKey(followed.avatar_key) || undefined : undefined}
                    alt={followed.display_name || followed.username}
                  />
                  <AvatarFallback>
                    {(followed.display_name || followed.username)?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="min-w-0">
                <Link href={`/u/${followed.username}`} className="hover:underline">
                  <p className="font-medium truncate">
                    {followed.display_name || followed.username}
                  </p>
                </Link>
                {followed.bio && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {followed.bio}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Following since {formatDistanceToNow(new Date(followed.followed_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnfollow(followed.id)}
              disabled={unfollowingStates[followed.id]}
            >
              {unfollowingStates[followed.id] ? 'Unfollowing...' : 'Unfollow'}
            </Button>
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
