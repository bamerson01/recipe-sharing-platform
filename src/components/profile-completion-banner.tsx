import Link from 'next/link';
import { getServerSupabase } from '@/lib/db/server';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowRight, User } from 'lucide-react';

export async function ProfileCompletionBanner() {
  const supabase = await getServerSupabase();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Check if user has username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();
  
  // If they have a username, don't show banner
  if (profile?.username) {
    return null;
  }
  
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <User className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          Complete your profile by choosing a username to unlock all features
        </span>
        <Button asChild size="sm" variant="default">
          <Link href="/onboarding/username">
            Choose Username
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}