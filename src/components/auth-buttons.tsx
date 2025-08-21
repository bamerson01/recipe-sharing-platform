"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { User } from "lucide-react";

export function AuthButtons() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-9 w-16 bg-muted animate-pulse rounded" />
        <div className="h-9 w-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/auth">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
      <Link href="/auth">
        <Button size="sm">
          Sign Up
        </Button>
      </Link>
    </div>
  );
}
