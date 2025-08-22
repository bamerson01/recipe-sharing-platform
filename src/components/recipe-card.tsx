import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { Clock, User } from "lucide-react";
import { imageSrcFromKey } from "@/lib/images/url";

interface RecipeCardProps {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  cover_image_key?: string | null;
  updated_at?: string | null;
  likeCount: number;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  categories: Array<{ name: string; slug: string }>;
  isLiked?: boolean;
  onOpenModal?: () => void;
  disableNavigation?: boolean;
}

export function RecipeCard({
  id,
  slug,
  title,
  summary,
  cover_image_key,
  updated_at,
  likeCount,
  authorName,
  authorUsername,
  authorAvatar,
  categories,
  isLiked = false,
  onOpenModal,
  disableNavigation = false,
}: RecipeCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {disableNavigation ? (
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] bg-muted">
            {cover_image_key ? (
              <Image
                src={imageSrcFromKey(cover_image_key, updated_at) || ''}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <span>No image</span>
              </div>
            )}
          </div>
        </CardHeader>
      ) : (
        <button
          onClick={onOpenModal}
          className="w-full text-left p-0"
        >
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] bg-muted">
              {cover_image_key ? (
                <Image
                  src={imageSrcFromKey(cover_image_key, updated_at) || ''}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <span>No image</span>
                </div>
              )}
            </div>
          </CardHeader>
        </button>
      )}

      <CardContent className="p-4">
        {disableNavigation ? (
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {title}
          </h3>
        ) : (
          <button
            onClick={onOpenModal}
            className="w-full text-left"
          >
            <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-2 cursor-pointer">
              {title}
            </h3>
          </button>
        )}

        {summary && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {summary}
          </p>
        )}

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Avatar className="h-5 w-5 mr-2">
            <AvatarImage src={authorAvatar || undefined} />
            <AvatarFallback className="text-xs">
              {authorName?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {authorUsername ? (
            <Link
              href={`/u/${authorUsername}`}
              className="hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {authorName}
            </Link>
          ) : (
            <span>{authorName}</span>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.slice(0, 3).map((category) => (
              <Badge key={category.slug} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{categories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SaveButton
            recipeId={id}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          />
          <LikeButton
            recipeId={id}
            initialLikeCount={likeCount}
            initialLiked={isLiked}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>5 min read</span>
        </div>
      </CardFooter>
    </Card>
  );
}
