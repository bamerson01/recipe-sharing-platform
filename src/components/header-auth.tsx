import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServerSupabase } from '@/lib/db/server';
import { signOutAction } from '@/app/_actions/sign-out';
import { User } from 'lucide-react';

export async function HeaderAuth() {
  const sb = await getServerSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center gap-x-4">
        <Link href="/auth">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        <Link href="/auth?mode=signup">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-4">
      <Link href="/profile">
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          Profile
        </Button>
      </Link>
      <form action={signOutAction}>
        <Button variant="outline" size="sm" type="submit">Sign Out</Button>
      </form>
    </div>
  );
}