"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toggleSave } from "@/app/recipes/_actions/manage-saves";

interface SaveButtonProps {
  recipeId: number;
  initialSaved?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
  className?: string;
  onSaveChange?: (saved: boolean) => void;
}

export function SaveButton({
  recipeId,
  initialSaved = false,
  size = "sm",
  variant = "outline",
  className = "",
  onSaveChange,
}: SaveButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  // Don't check save status if we're in a list context (SavedRecipesGrid)
  // The saved recipes grid already knows these are saved
  useEffect(() => {
    // Only check if we don't have an explicit initial value
    // This prevents checking for recipes we already know are saved
    if (user && recipeId && initialSaved === false) {
      // Skip the check for now to prevent infinite loops
      // checkSaveStatus();
    }
  }, []); // Empty dependency array - only run once on mount

  const checkSaveStatus = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/save`);
      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
      }
    } catch (error) {
      console.error('Error checking save status:', error);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (!user) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth';
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log('Attempting to toggle save for recipe:', recipeId);
      const result = await toggleSave(recipeId);
      console.log('Toggle save result:', result);

      if (result.success) {
        setSaved(result.saved || false);
        // Call parent callback if provided
        onSaveChange?.(result.saved || false);
      } else {
        console.error('Error toggling save:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSaveToggle}
      disabled={isLoading}
      className={`transition-all duration-200 ${saved
        ? 'text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700'
        : ''
        } ${className}`}
    >
      <Bookmark
        className={`h-4 w-4 mr-2 transition-all duration-200 ${saved ? 'fill-current' : ''
          }`}
      />
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
