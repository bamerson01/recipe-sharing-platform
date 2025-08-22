"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NavWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      // Refresh the server components when auth state changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Add a small delay to ensure cookies are properly set
        setTimeout(() => {
          router.refresh();
        }, 100);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}