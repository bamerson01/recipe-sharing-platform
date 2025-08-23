"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ChefHat, Edit, Trash2, Eye, EyeOff, ExternalLink, Share2, Heart, Bookmark, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getProfileUrl, getRecipeUrl } from "@/lib/urls";
import { imageSrcFromKey } from "@/lib/images/url";
import { RecipeSummary, RecipeFull } from "@/types/recipe";
import { ShareModal } from "./share-modal";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { FollowButton } from "@/components/follow-button";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number | null;
  variant?: 'default' | 'owner';
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleVisibility?: (id: number, isPublic: boolean) => void;
  onSaveChange?: (id: number, saved: boolean) => void;
}

export function RecipeDetailModal({
  isOpen,
  onClose,
  recipeId,
  variant = 'default',
  onEdit,
  onDelete,
  onToggleVisibility,
  onSaveChange
}: RecipeDetailModalProps) {
  const [recipe, setRecipe] = useState<RecipeFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      if (!recipeId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipe details');
        }
        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && recipeId) {
      fetchRecipeDetails();
    } else if (!isOpen) {
      // Reset state when modal closes
      setRecipe(null);
      setError(null);
    }
  }, [isOpen, recipeId]);

  const handleDelete = async () => {
    if (!recipe || !confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }
    await onDelete?.(recipe.id);
    onClose();
  };

  const isOwner = variant === 'owner';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold pr-8">
            {loading ? "Loading Recipe..." : error ? "Error" : recipe?.title || "Recipe Details"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {loading ? "Loading recipe details" : error ? "Error loading recipe" : "Recipe details and instructions"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        ) : recipe ? (
          <>
            {/* Sticky Actions Bar */}
            <div className="sticky top-0 z-10 bg-background border-b pb-3 pt-2">
              {isOwner ? (
                // Owner variant layout
                <div className="space-y-3">
                  {/* Stats row */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{recipe.like_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{recipe.save_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{recipe.comment_count || 0}</span>
                    </div>
                  </div>
                  
                  {/* Action buttons row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleVisibility?.(recipe.id, recipe.is_public)}
                    >
                      {recipe.is_public ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(recipe.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Link href={getRecipeUrl(recipe.id, recipe.title)}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Recipe
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                // Default variant layout
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SaveButton
                      recipeId={recipe.id}
                      size="sm"
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                      onSaveChange={(saved) => onSaveChange?.(recipe.id, saved)}
                    />
                    <LikeButton
                      recipeId={recipe.id}
                      initialLikeCount={recipe.like_count}
                      initialLiked={recipe.is_liked}
                      size="sm"
                      variant="outline"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowShareModal(true)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  
                  <Link href={getRecipeUrl(recipe.id, recipe.title)}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Recipe
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 space-y-6 px-6 pb-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* Author info - only show if not owner */}
                {!isOwner && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={recipe.author.avatar_key
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.author.avatar_key}`
                          : undefined
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {recipe.author.display_name?.[0]?.toUpperCase() ||
                          recipe.author.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      href={getProfileUrl(recipe.author.username)}
                      className="hover:text-primary transition-colors"
                    >
                      {recipe.author.display_name || recipe.author.username || 'Anonymous'}
                    </Link>
                    {recipe.author.username && (
                      <FollowButton
                        username={recipe.author.username}
                        userId={recipe.author.id}
                        variant="ghost"
                        size="sm"
                        showText={false}
                      />
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Categories */}
              {recipe.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipe.categories.map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Time and Difficulty */}
              {(recipe.difficulty || recipe.prep_time || recipe.cook_time) && (
                <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  {recipe.difficulty && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Difficulty:</span>
                      <span className={`text-sm font-semibold ${recipe.difficulty === 'easy' ? 'text-green-600' :
                          recipe.difficulty === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                        {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                      </span>
                    </div>
                  )}
                  {recipe.prep_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Prep:</span> {recipe.prep_time} min
                      </span>
                    </div>
                  )}
                  {recipe.cook_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Cook:</span> {recipe.cook_time} min
                      </span>
                    </div>
                  )}
                  {recipe.prep_time && recipe.cook_time && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className="font-medium">Total:</span> {recipe.prep_time + recipe.cook_time} min
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Cover Image */}
              {recipe.cover_image_key && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={imageSrcFromKey(recipe.cover_image_key, recipe.updated_at) || ''}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Summary */}
              {recipe.summary && (
                <p className="text-lg text-muted-foreground">{recipe.summary}</p>
              )}

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Ingredients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={ingredient.id} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6 mt-1">
                            {index + 1}.
                          </span>
                          <span className="flex-1">{ingredient.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No ingredients listed</p>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.steps && recipe.steps.length > 0 ? (
                    <ol className="space-y-4">
                      {recipe.steps.map((step, index) => (
                        <li key={step.id} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6 mt-1">
                            {index + 1}.
                          </span>
                          <p className="flex-1">{step.text}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No instructions listed</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        {/* Share Modal */}
        {recipe && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            recipe={recipe}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}