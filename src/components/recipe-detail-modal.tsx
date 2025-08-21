"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Share2, ChefHat, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
}

export function RecipeDetailModal({
  isOpen,
  onClose,
  recipe,
  isOwner = false,
  onEdit,
  onDelete,
  onToggleVisibility,
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
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <Link
                  href={`/u/${recipe.author?.username || recipe.author?.id || 'anonymous'}`}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  {recipe.author?.display_name || recipe.author?.username || 'Anonymous'}
                </Link>
              </div>
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
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}`}
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
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                {recipe.like_count} likes
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* View Full Page Link */}
            <Link href={`/r/${recipe.slug}`}>
              <Button variant="outline" size="sm">
                View Full Page
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
