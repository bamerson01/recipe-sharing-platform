import { Suspense } from "react";
import { getServerSupabase } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsInteractionsList } from "./_components/comments-interactions-list";

async function CommentsInteractionsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Comments</h1>
        <p className="text-muted-foreground">
          See who commented on your recipes
        </p>
      </div>

      <Suspense fallback={<CommentsInteractionsSkeleton />}>
        <CommentsInteractionsList />
      </Suspense>
    </div>
  );
}

function CommentsInteractionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export default CommentsInteractionsPage;
