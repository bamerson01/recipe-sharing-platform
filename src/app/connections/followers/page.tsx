import { Suspense } from "react";
import { getServerSupabase } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowersList } from "./_components/followers-list";

async function FollowersPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Followers</h1>
        <p className="text-muted-foreground">
          People who follow you
        </p>
      </div>

      <Suspense fallback={<FollowersSkeleton />}>
        <FollowersList userId={user.id} />
      </Suspense>
    </div>
  );
}

function FollowersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

export default FollowersPage;
