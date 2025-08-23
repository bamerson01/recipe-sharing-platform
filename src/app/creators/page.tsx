"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, ChefHat, UserPlus, UserCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { followUser, unfollowUser } from "@/app/_actions/manage-follows";
import { toast } from "sonner";

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  recipe_count: number;
  follower_count: number;
  is_following?: boolean;
}

export default function CreatorsPage() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingFollows, setLoadingFollows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCreators();
  }, [user]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creators');
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators);
        
        // Initialize following states
        const states: Record<string, boolean> = {};
        data.creators.forEach((creator: Creator) => {
          states[creator.id] = creator.is_following || false;
        });
        setFollowingStates(states);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (creatorId: string) => {
    if (!user) {
      toast.error("Please sign in to follow creators");
      return;
    }

    setLoadingFollows(prev => ({ ...prev, [creatorId]: true }));

    try {
      const isFollowing = followingStates[creatorId];
      
      if (isFollowing) {
        const result = await unfollowUser(creatorId);
        if (result.success) {
          setFollowingStates(prev => ({ ...prev, [creatorId]: false }));
          toast.success("Unfollowed successfully");
        } else {
          toast.error(result.error || "Failed to unfollow");
        }
      } else {
        const result = await followUser(creatorId);
        if (result.success) {
          setFollowingStates(prev => ({ ...prev, [creatorId]: true }));
          toast.success("Following successfully");
        } else {
          toast.error(result.error || "Failed to follow");
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("An error occurred");
    } finally {
      setLoadingFollows(prev => ({ ...prev, [creatorId]: false }));
    }
  };

  const filteredCreators = creators.filter(creator => {
    const query = searchQuery.toLowerCase();
    return (
      creator.username?.toLowerCase().includes(query) ||
      creator.display_name?.toLowerCase().includes(query) ||
      creator.bio?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Discover Creators</h1>
          <p className="text-muted-foreground">
            Find and follow talented recipe creators
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Discover Creators</h1>
        <p className="text-muted-foreground mb-6">
          Find and follow talented recipe creators
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredCreators.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : "No creators available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCreators.map((creator) => (
            <Card key={creator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Avatar */}
                <Link href={`/u/${creator.username}`}>
                  <Avatar className="h-20 w-20 mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage
                      src={creator.avatar_key
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${creator.avatar_key}`
                        : undefined
                      }
                    />
                    <AvatarFallback className="text-lg">
                      {creator.display_name?.[0]?.toUpperCase() ||
                        creator.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                {/* Creator Info */}
                <div className="text-center mb-4">
                  <Link href={`/u/${creator.username}`}>
                    <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                      {creator.display_name || creator.username}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    @{creator.username}
                  </p>
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 mb-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{creator.recipe_count}</span>
                    <span className="text-muted-foreground">recipes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{creator.follower_count}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                </div>

                {/* Follow Button */}
                {user && creator.id !== user.id && (
                  <Button
                    onClick={() => handleFollow(creator.id)}
                    disabled={loadingFollows[creator.id]}
                    variant={followingStates[creator.id] ? "secondary" : "default"}
                    className="w-full"
                  >
                    {loadingFollows[creator.id] ? (
                      "Loading..."
                    ) : followingStates[creator.id] ? (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}

                {/* View Profile for own card */}
                {user && creator.id === user.id && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile">
                      View Your Profile
                    </Link>
                  </Button>
                )}

                {/* Sign in prompt for non-authenticated users */}
                {!user && (
                  <Button asChild className="w-full">
                    <Link href="/auth">
                      Sign In to Follow
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}