"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, Search, Plus, BookOpen, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function MainNav() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
          <Link href="/explore" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-4 w-4" />
            <span>Explore</span>
          </Link>

          {user && (
            <>
              <Link href="/new" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="h-4 w-4" />
                <span>New Recipe</span>
              </Link>
              <Link href="/my-recipes" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <BookOpen className="h-4 w-4" />
                <span>My Recipes</span>
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
