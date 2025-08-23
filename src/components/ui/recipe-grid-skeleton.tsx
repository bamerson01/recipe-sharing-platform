import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RecipeGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function RecipeGridSkeleton({ 
  count = 6, 
  columns = 3,
  className 
}: RecipeGridSkeletonProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn(`grid gap-6 ${gridClasses[columns]}`, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />
      
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Summary */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      {/* Author and metadata */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      
      {/* Categories */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}