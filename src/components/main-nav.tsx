"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, Search, Plus, BookOpen, User } from "lucide-react";
import { AuthButtons } from "./auth-buttons";
import { UserNav } from "./user-nav";

export function MainNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 pl-4">
          <Link href="/" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6" />
            <span className="font-bold text-xl">RecipeNest</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link href="/explore" className="transition-colors hover:text-foreground/80">
            Explore
          </Link>
          <UserNav />
        </nav>

        <div className="flex items-center space-x-4" suppressHydrationWarning>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
