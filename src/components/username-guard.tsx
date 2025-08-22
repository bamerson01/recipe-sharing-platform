import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/db/server';

interface UsernameGuardProps {
  children: React.ReactNode;
  exemptPaths?: string[];
}

export async function UsernameGuard({ children, exemptPaths = [] }: UsernameGuardProps) {
  const supabase = await getServerSupabase();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    
    // Check if we're on an exempt path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isExemptPath = exemptPaths.some(path => currentPath.startsWith(path));
    
    // If user has no username and not on exempt path, redirect to onboarding
    if (!profile?.username && !isExemptPath) {
      redirect('/onboarding/username');
    }
  }
  
  return <>{children}</>;
}