import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, User } from "lucide-react";

interface RecipeCardProps {
  slug: string;
  title: string;
  summary?: string | null;
  imagePath?: string | null;
  likeCount: number;
  authorName: string;
  categories: Array<{ name: string; slug: string }>;
  isLiked?: boolean;
  onLikeToggle?: () => void;
}

export function RecipeCard({
  slug,
  title,
  summary,
  imagePath,
  likeCount,
  authorName,
  categories,
  isLiked = false,
  onLikeToggle,
}: RecipeCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/r/${slug}`}>
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
      </Link>

      <CardContent className="p-4">
        <Link href={`/r/${slug}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {summary && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {summary}
          </p>
        )}

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <User className="h-4 w-4 mr-1" />
          <span>{authorName}</span>
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
          onClick={onLikeToggle}
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
