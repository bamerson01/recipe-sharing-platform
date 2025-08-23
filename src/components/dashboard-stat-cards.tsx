"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChefHat,
  Heart,
  Bookmark,
  Users,
  MessageSquare,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
}

function StatCard({ title, value, description, icon, href, className }: StatCardProps) {
  return (
    <Link href={href} className="block">
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer group",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold group-hover:text-primary transition-colors">
            {value.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface DashboardStatCardsProps {
  stats: {
    recipeCount: number;
    savedCount: number;
    totalLikes: number;
    totalComments: number;
    followerCount: number;
    followingCount: number;
  };
}

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="My Recipes"
        value={stats.recipeCount}
        description="Total recipes created"
        icon={<ChefHat className="h-4 w-4" />}
        href="/my-recipes"
      />

      <StatCard
        title="Saved Recipes"
        value={stats.savedCount}
        description="Recipes to try later"
        icon={<Bookmark className="h-4 w-4" />}
        href="/saved-recipes"
      />

      <StatCard
        title="Total Likes"
        value={stats.totalLikes}
        description="Across all recipes"
        icon={<Heart className="h-4 w-4" />}
        href="/interactions/likes"
      />

      <StatCard
        title="Total Comments"
        value={stats.totalComments}
        description="On your recipes"
        icon={<MessageSquare className="h-4 w-4" />}
        href="/interactions/comments"
      />

      <StatCard
        title="Followers"
        value={stats.followerCount}
        description="People following you"
        icon={<Users className="h-4 w-4" />}
        href="/connections/followers"
      />

      <StatCard
        title="Following"
        value={stats.followingCount}
        description="People you follow"
        icon={<UserPlus className="h-4 w-4" />}
        href="/connections/following"
      />
    </div>
  );
}
