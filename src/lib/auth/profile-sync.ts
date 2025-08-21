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
    const emailPrefix = user.email?.split('@')[0] || '';
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: emailPrefix || null, // Use email prefix as username
        display_name: user.user_metadata?.full_name || emailPrefix || 'Anonymous', // Use email prefix if no full name
        bio: null, // Bio is null on account creation
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
