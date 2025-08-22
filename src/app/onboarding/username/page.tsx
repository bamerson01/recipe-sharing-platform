import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/db/server';
import { UsernameForm } from './_components/username-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UsernameOnboardingPage() {
  const supabase = await getServerSupabase();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth');
  }
  
  // Check if user already has a username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();
  
  // If they already have a username, redirect to home
  if (profile?.username) {
    redirect('/');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Choose Your Username</CardTitle>
            <CardDescription>
              Pick a unique username that will be your public identity on RecipeNest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsernameForm />
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Your username will be used for:</p>
          <ul className="mt-2 space-y-1">
            <li>• Your public profile URL</li>
            <li>• How other users find and mention you</li>
            <li>• Attribution on your recipes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}