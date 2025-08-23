"use client";

import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface LikeButtonProps {
  recipeId: number;
  initialLikeCount: number;
  initialLiked?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
  className?: string;
  onLikeChange?: (liked: boolean, newCount: number) => void;
}

export const LikeButton = memo(function LikeButton({
  recipeId,
  initialLikeCount,
  initialLiked = false,
  size = "sm",
  variant = "outline",
  className = "",
  onLikeChange,
}: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial like status when component mounts
  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, recipeId]);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`);
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
      }
    } catch (error) {    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (!user) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth';
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        const newLiked = data.liked;
        const newCount = newLiked ? likeCount + 1 : likeCount - 1;

        setLiked(newLiked);
        setLikeCount(newCount);

        // Call parent callback if provided
        onLikeChange?.(newLiked, newCount);
      } else {
        const errorData = await response.json();      }
    } catch (error) {    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`transition-all duration-200 ${liked
          ? 'text-primary hover:text-primary/90 border-primary hover:border-primary/90'
          : ''
        } ${className}`}
    >
      <ChefHat
        className={`h-4 w-4 mr-2 transition-all duration-200 ${liked ? 'fill-current' : ''
          }`}
      />
      {likeCount}
    </Button>
  );
});
