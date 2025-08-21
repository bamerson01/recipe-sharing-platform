"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function UserNav() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <>
      <Link href="/recipes/new" className="transition-colors hover:text-foreground/80">
        New Recipe
      </Link>
      <Link href="/recipes/my" className="transition-colors hover:text-foreground/80">
        My Recipes
      </Link>
    </>
  );
}
