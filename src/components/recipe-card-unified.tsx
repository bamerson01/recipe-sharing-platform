"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { Clock, MoreVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { imageSrcFromKey } from "@/lib/images/url";
import { getRecipeUrl, getProfileUrl } from "@/lib/urls";
import type { RecipeCardProps } from "@/types/recipe";

export function RecipeCard({
  recipe,
  variant = 'default',
  onOpenModal,
  onEdit,
  onDelete,
  onToggleVisibility,
  onSaveChange
}: RecipeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking interactive elements
    if ((e.target as HTMLElement).closest('a, button, [role="button"]')) {
      return;
    }
    onOpenModal?.(recipe);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    await onDelete?.(recipe.id);
    setIsDeleting(false);
  };

  const isOwner = variant === 'owner';

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
      role="article"
      aria-label={`Recipe: ${recipe.title}`}
    >
      {/* Image Header */}
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] bg-muted">
          {recipe.cover_image_key ? (
            <Image
              src={imageSrcFromKey(recipe.cover_image_key, recipe.updated_at) || ''}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span>No image</span>
            </div>
          )}

          {/* Owner controls dropdown */}
          {isOwner && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Recipe options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(recipe.id);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility?.(recipe.id, recipe.is_public);
                    }}
                  >
                    {recipe.is_public ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Make Public
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Visibility badge for owner */}
          {isOwner && !recipe.is_public && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                <EyeOff className="mr-1 h-3 w-3" />
                Private
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
          {recipe.title}
        </h3>

        {/* Summary */}
        {recipe.summary && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {recipe.summary}
          </p>
        )}

        {/* Author - clickable, navigates to profile */}
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Avatar className="h-5 w-5 mr-2">
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
            onClick={(e) => e.stopPropagation()}
          >
            {recipe.author.display_name || recipe.author.username || 'Anonymous'}
          </Link>
        </div>

        {/* Categories */}
        {recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.categories.slice(0, 3).map((category) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {recipe.categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.categories.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Time and Difficulty */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {recipe.difficulty && (
            <div className="flex items-center gap-1">
              <span className={`font-medium ${recipe.difficulty === 'easy' ? 'text-green-600' :
                  recipe.difficulty === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                }`}>
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </span>
            </div>
          )}
          {(recipe.prep_time || recipe.cook_time) && (
            <>
              {recipe.prep_time && (
                <div className="flex items-center gap-1">
                  <span>Prep: {recipe.prep_time}m</span>
                </div>
              )}
              {recipe.cook_time && (
                <div className="flex items-center gap-1">
                  <span>Cook: {recipe.cook_time}m</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <SaveButton
            recipeId={recipe.id}
            initialSaved={recipe.is_saved || false}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onSaveChange={(saved) => onSaveChange?.(recipe.id, saved)}
          />
          <LikeButton
            recipeId={recipe.id}
            initialLikeCount={recipe.like_count}
            initialLiked={recipe.is_liked}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          />
          <ShareButton
            recipe={{
              id: recipe.id,
              title: recipe.title,
              summary: recipe.summary,
              cover_image_key: recipe.cover_image_key,
              author: recipe.author,
              categories: recipe.categories
            }}
            size="sm"
            variant="outline"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>

        {/* Timestamp */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}