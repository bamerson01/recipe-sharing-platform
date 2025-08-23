"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  redirectToProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = createClient().auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth state changes
        if (event === 'SIGNED_IN' && session?.user) {
          // Refresh the page to update server components (like navigation)
          router.refresh();
          
          // Only redirect if we're on an auth page
          const currentPath = window.location.pathname;
          if (currentPath === '/auth') {
            // Check if user profile is complete
            const supabase = createClient();
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, display_name')
              .eq('id', session.user.id)
              .single();
            
            // If profile is incomplete (no username or display_name), go to profile
            // Otherwise go to dashboard
            if (!profile?.username || !profile?.display_name) {
              router.push('/profile');
            } else {
              router.push('/dashboard');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Refresh the page to update server components (like navigation)
          router.refresh();
          // Redirect to home page after sign out
          router.push('/');
        }
        // Ignore TOKEN_REFRESH and other events to prevent unwanted redirects
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const signUp = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const redirectToProfile = () => {
    if (user) {
      router.push('/profile');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      redirectToProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
