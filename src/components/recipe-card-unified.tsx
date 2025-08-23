"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, memo } from "react";
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
import { FollowButton } from "@/components/follow-button";
import { 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Heart, 
  Bookmark, 
  MessageCircle,
  ChefHat,
  Users,
  Flame
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { imageSrcFromKey } from "@/lib/images/url";
import { getRecipeUrl, getProfileUrl } from "@/lib/urls";
import { getBlurPlaceholder, getImageSizes } from "@/lib/images/blur-placeholder";
import type { RecipeCardProps } from "@/types/recipe";

interface RecipeCardWithIndexProps extends RecipeCardProps {
  index?: number;
}

export const RecipeCard = memo(function RecipeCard({
  recipe,
  variant = 'default',
  onOpenModal,
  onEdit,
  onDelete,
  onToggleVisibility,
  onSaveChange,
  index = 0
}: RecipeCardWithIndexProps) {
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
        <div className="relative aspect-[4/3] bg-gradient-to-b from-muted/50 to-muted">
          {recipe.cover_image_key ? (
            <Image
              src={imageSrcFromKey(recipe.cover_image_key, recipe.updated_at) || ''}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes={getImageSizes('card')}
              placeholder="blur"
              blurDataURL={getBlurPlaceholder('recipe')}
              priority={index < 3}
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
                    className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow"
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
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-sm">
                <EyeOff className="mr-1 h-3 w-3" />
                Private
              </Badge>
            </div>
          )}
          
          {/* Quick recipe badge for <30 min recipes */}
          {recipe.prep_time && recipe.cook_time && (recipe.prep_time + recipe.cook_time) < 30 && (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-accent/90 text-accent-foreground backdrop-blur-sm shadow-sm">
                <Flame className="mr-1 h-3 w-3" />
                Quick Recipe
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-serif font-semibold text-xl mb-2 line-clamp-2 hover:text-primary transition-colors">
          {recipe.title}
        </h3>

        {/* Summary */}
        {recipe.summary && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {recipe.summary}
          </p>
        )}

        {/* Author and Date */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
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
              onClick={(e) => e.stopPropagation()}
            >
              {recipe.author.display_name || recipe.author.username || 'Anonymous'}
            </Link>
            {recipe.author.username && (
              <div onClick={(e) => e.stopPropagation()}>
                <FollowButton
                  username={recipe.author.username}
                  userId={recipe.author.id}
                  variant="ghost"
                  size="sm"
                  showText={false}
                />
              </div>
            )}
          </div>
          <span className="text-xs">
            {new Date(recipe.created_at).toLocaleDateString()}
          </span>
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
        <div className="flex items-center gap-3 text-xs">
          {recipe.difficulty && (
            <Badge 
              variant="outline" 
              className={`border-2 font-medium ${
                recipe.difficulty === 'easy' ? 'border-recipe-easy text-recipe-easy' :
                  recipe.difficulty === 'medium' ? 'border-recipe-medium text-recipe-medium' :
                    'border-recipe-hard text-recipe-hard'
                }`}
            >
              <ChefHat className="h-3 w-3 mr-1" />
              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            </Badge>
          )}
          {(recipe.prep_time || recipe.cook_time) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {recipe.prep_time && recipe.cook_time ? (
                <span className="font-medium">{recipe.prep_time + recipe.cook_time} min</span>
              ) : (
                <span className="font-medium">
                  {recipe.prep_time ? `${recipe.prep_time} min` : `${recipe.cook_time} min`}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isOwner ? (
          // Owner variant: Show engagement metrics
          <div className="flex items-center justify-between w-full">
            {/* Engagement metrics */}
            <div className="flex items-center gap-3 text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Heart className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-semibold">{recipe.like_count || 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Favorites</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                      <div className="p-1.5 rounded-full bg-secondary/10">
                        <Bookmark className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      <span className="font-semibold">{recipe.save_count || 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Saved to Cookbooks</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                      <div className="p-1.5 rounded-full bg-accent/10">
                        <MessageCircle className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <span className="font-semibold">{recipe.comment_count || 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Reviews</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(recipe.id);
                      }}
                      className="h-8 px-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit recipe</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility?.(recipe.id, recipe.is_public);
                      }}
                      className="h-8 px-2"
                    >
                      {recipe.is_public ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {recipe.is_public ? 'Make private' : 'Make public'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete recipe</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          // Default variant: Show interaction buttons
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
        )}
      </CardFooter>
    </Card>
  );
});