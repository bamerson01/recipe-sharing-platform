import { Suspense } from "react";
import { getServerSupabase } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ChefHat,
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";
import { DashboardStatCards } from "@/components/dashboard-stat-cards";
import { FromPeopleYouFollow } from "@/components/from-people-you-follow";

async function DashboardStats() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch user stats in parallel
  const [
    { count: recipeCount },
    { count: savedCount },
    { data: profile },
    { data: recipesWithStats }
  ] = await Promise.all([
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('saves').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('follower_count, following_count').eq('id', user.id).single(),
    // Get recipes with their like counts and IDs for comment counting
    supabase.from('recipes').select('id, like_count').eq('author_id', user.id)
  ]);

  // Get comment count if user has recipes
  let totalComments = 0;
  if (recipesWithStats && recipesWithStats.length > 0) {
    const recipeIds = recipesWithStats.map(r => r.id);
    const { count } = await supabase
      .from('recipe_comments')
      .select('*', { count: 'exact', head: true })
      .in('recipe_id', recipeIds);
    totalComments = count || 0;
  }

  // Calculate totals
  const totalLikes = recipesWithStats?.reduce((sum, r) => sum + (r.like_count || 0), 0) || 0;

  const stats = {
    recipeCount: recipeCount || 0,
    savedCount: savedCount || 0,
    totalLikes,
    totalComments: totalComments || 0,
    followerCount: profile?.follower_count || 0,
    followingCount: profile?.following_count || 0,
  };

  return <DashboardStatCards stats={stats} />;
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

async function PopularRecipes() {
  const supabase = await getServerSupabase();

  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id,
      title,
      slug,
      cover_image_key,
      like_count,
      author:profiles!inner(
        display_name,
        username
      )
    `)
    .eq('is_public', true)
    .order('like_count', { ascending: false })
    .limit(5);

  if (!recipes || recipes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trending Recipes</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recipes">
            Browse Recipes <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-4">
        {recipes.map((recipe, index) => (
          <div key={recipe.id} className="flex items-center space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/r/${recipe.id}-${recipe.slug}`} className="hover:underline">
                <p className="text-sm font-medium truncate">{recipe.title}</p>
              </Link>
              <p className="text-sm text-muted-foreground">
                by {(recipe.author as any).display_name || (recipe.author as any).username} · {recipe.like_count} likes
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.display_name || profile?.username || 'Chef'}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your recipes today
        </p>
      </div>

      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" /> Create Recipe
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">
              <TrendingUp className="mr-2 h-4 w-4" /> Browse Recipes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">
              <ChefHat className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStats />
        </Suspense>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <FromPeopleYouFollow />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <PopularRecipes />
          </Suspense>
        </div>
      </div>
    </div>
  );
}