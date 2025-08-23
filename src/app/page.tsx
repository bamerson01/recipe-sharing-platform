import { getServerSupabase } from "@/lib/db/server";
import { redirect } from "next/navigation";
import LandingPage from "./landing-page";

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}