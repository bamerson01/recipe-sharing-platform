import { Suspense } from "react";
import { getServerSupabase } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { LikesInteractionsList } from "./_components/likes-interactions-list";

async function LikesInteractionsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Likes</h1>
        <p className="text-muted-foreground">
          See who liked your recipes
        </p>
      </div>

      <Suspense fallback={<LikesInteractionsSkeleton />}>
        <LikesInteractionsList />
      </Suspense>
    </div>
  );
}

function LikesInteractionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export default LikesInteractionsPage;
