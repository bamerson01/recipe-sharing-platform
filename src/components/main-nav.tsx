import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import { HeaderAuth } from '@/components/header-auth';
import { getServerSupabase } from '@/lib/db/server';

export async function MainNav() {
  const sb = await getServerSupabase();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-xl flex h-16 items-center px-4 sm:px-6 lg:px-8 gap-x-6">
        {/* Brand cluster */}
        <Link href="/" className="flex items-center gap-x-2">
          <ChefHat className="h-6 w-6" />
          <span className="font-bold text-xl">RecipeNest</span>
        </Link>

        {/* Nav cluster - hidden on mobile, takes available space on desktop */}
        <nav className="hidden md:flex flex-1 items-center gap-x-6 text-sm font-medium">
          <Link href="/explore" className="transition-colors hover:text-foreground/80">
            Explore
          </Link>
          {user && (
            <>
              <Link href="/feed" className="transition-colors hover:text-foreground/80">
                Feed
              </Link>
              <Link href="/recipes/new" className="transition-colors hover:text-foreground/80">
                New Recipe
              </Link>
              <Link href="/recipes/my" className="transition-colors hover:text-foreground/80">
                My Recipes
              </Link>
              <Link href="/saved" className="transition-colors hover:text-foreground/80">
                Saved
              </Link>
            </>
          )}
        </nav>

        {/* Auth cluster */}
        <HeaderAuth />
      </div>
    </header>
  );
}