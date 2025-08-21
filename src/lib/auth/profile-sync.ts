import { getServerSupabase } from "@/lib/db/server";
import { User } from "@supabase/supabase-js";

export async function syncUserProfile(user: User) {
  const supabase = await getServerSupabase();

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingProfile) {
    // Create new profile
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: null,
        display_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      });

    if (error) {
      console.error("Error creating profile:", error);
      return { error };
    }

    return { success: true };
  }

  return { success: true };
}
