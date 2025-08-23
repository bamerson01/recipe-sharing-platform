"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { getFollowers } from "@/app/_actions/manage-follows";
import { followUser } from "@/app/_actions/manage-follows";
import { imageSrcFromKey } from "@/lib/images/url";
import { formatDistanceToNow } from "date-fns";

interface Follower {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  followed_at: string;
}

interface FollowersListProps {
  userId: string;
}

export function FollowersList({ userId }: FollowersListProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const result = await getFollowers(userId, pageNum, 20);

      if (result.success && result.followers) {
        if (pageNum === 1) {
          setFollowers(result.followers);
        } else {
          setFollowers(prev => [...prev, ...result.followers]);
        }
        setHasMore(result.followers.length === 20);
        setPage(pageNum);
      } else {
        setError(result.error || 'Failed to load followers');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFollowers(page + 1);
    }
  };

  const handleFollowBack = async (followerId: string) => {
    try {
      setFollowingStates(prev => ({ ...prev, [followerId]: true }));

      const result = await followUser(followerId);

      if (result.success) {
        // Update the local state to show they're now following
        setFollowingStates(prev => ({ ...prev, [followerId]: false }));
      } else {        setFollowingStates(prev => ({ ...prev, [followerId]: false }));
      }
    } catch (error) {      setFollowingStates(prev => ({ ...prev, [followerId]: false }));
    }
  };

  if (loading && followers.length === 0) {
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
            Unable to load followers
          </p>
          <Button onClick={() => loadFollowers(1)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (followers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No followers yet</h3>
          <p className="text-muted-foreground mb-4">
            Share your profile and recipes to start building your following
          </p>
          <Button asChild>
            <Link href="/profile">
              <UserPlus className="mr-2 h-4 w-4" />
              View Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map((follower) => (
        <Card key={follower.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Link href={`/u/${follower.username}`} className="flex-shrink-0">
                <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src={follower.avatar_key ? imageSrcFromKey(follower.avatar_key) || undefined : undefined}
                    alt={follower.display_name || follower.username}
                  />
                  <AvatarFallback>
                    {(follower.display_name || follower.username)?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="min-w-0">
                <Link href={`/u/${follower.username}`} className="hover:underline">
                  <p className="font-medium truncate">
                    {follower.display_name || follower.username}
                  </p>
                </Link>
                {follower.bio && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {follower.bio}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Followed you {formatDistanceToNow(new Date(follower.followed_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFollowBack(follower.id)}
              disabled={followingStates[follower.id]}
            >
              {followingStates[follower.id] ? 'Following...' : 'Follow Back'}
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
