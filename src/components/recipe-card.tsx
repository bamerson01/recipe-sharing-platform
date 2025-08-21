import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Clock, User } from "lucide-react";

interface RecipeCardProps {
  slug: string;
  title: string;
  summary?: string | null;
  imagePath?: string | null;
  likeCount: number;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  categories: Array<{ name: string; slug: string }>;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  onOpenModal?: () => void;
  disableNavigation?: boolean;
}

export function RecipeCard({
  slug,
  title,
  summary,
  imagePath,
  likeCount,
  authorName,
  authorUsername,
  authorAvatar,
  categories,
  isLiked = false,
  onLikeToggle,
  onOpenModal,
  disableNavigation = false,
}: RecipeCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {disableNavigation ? (
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] bg-muted">
            {imagePath ? (
              <Image
                src={imagePath}
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
              {imagePath ? (
                <Image
                  src={imagePath}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle?.();
          }}
          className={`flex items-center space-x-1 transition-colors ${isLiked
            ? 'text-red-500 hover:text-red-600'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{likeCount}</span>
        </button>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>5 min read</span>
        </div>
      </CardFooter>
    </Card>
  );
}
