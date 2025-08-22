"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { Share2, ChefHat, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { imageSrcFromKey } from "@/lib/images/url";

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    id: number;
    title: string;
    slug: string;
    summary?: string | null;
    cover_image_key?: string | null;
    like_count: number;
    is_public: boolean;
    created_at: string;
    author: {
      id: string;
      display_name: string | null;
      username: string | null;
      avatar_key?: string | null;
    };
    ingredients: Array<{
      id: number;
      position: number;
      text: string;
    }>;
    steps: Array<{
      id: number;
      position: number;
      text: string;
    }>;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  } | null;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onSaveChange?: (saved: boolean) => void;
}

export function RecipeDetailModal({
  isOpen,
  onClose,
  recipe,
  isOwner = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  onSaveChange,
}: RecipeDetailModalProps) {
  if (!recipe) return null;



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {recipe.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Only show author info if not the owner */}
              {!isOwner && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={recipe.author?.avatar_key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.author.avatar_key}` : undefined} />
                    <AvatarFallback className="text-xs">
                      {recipe.author?.display_name?.[0]?.toUpperCase() || recipe.author?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/u/${recipe.author?.username || recipe.author?.id || 'anonymous'}`}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {recipe.author?.display_name || recipe.author?.username || 'Anonymous'}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleVisibility}
                >
                  {recipe.is_public ? 'Make Private' : 'Make Public'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Categories */}
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.categories.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
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

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <SaveButton
                recipeId={recipe.id}
                size="sm"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                onSaveChange={onSaveChange}
              />
              <LikeButton
                recipeId={recipe.id}
                initialLikeCount={recipe.like_count}
                size="sm"
                variant="outline"
              />
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* View Full Recipe Link */}
            <Link href={`/r/${recipe.slug}`}>
              <Button variant="outline" size="sm">
                View Full Recipe
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
