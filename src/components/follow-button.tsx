"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  username: string;
  userId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showText?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  username,
  userId,
  variant = "default",
  size = "default",
  showText = true,
  onFollowChange
}: FollowButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Check if already following
  useEffect(() => {
    if (!user || user.id === userId) {
      setLoading(false);
      return;
    }

    checkFollowStatus();
  }, [user, username]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/users/${username}/follow`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      router.push("/auth");
      return;
    }

    setUpdating(true);
    const newFollowState = !isFollowing;

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: newFollowState ? "POST" : "DELETE"
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);
        toast.success(data.message);
        
        // Refresh the page to update follower counts
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update follow status");
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setUpdating(false);
    }
  };

  // Don't show button for self
  if (user?.id === userId) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={updating}
    >
      {updating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          {showText && <span className="ml-2">Unfollow</span>}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {showText && <span className="ml-2">Follow</span>}
        </>
      )}
    </Button>
  );
}