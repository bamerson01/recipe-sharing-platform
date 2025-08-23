export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_key: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedRecipe {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  like_count: number;
  is_public: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  prep_time: number | null;
  cook_time: number | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_key: string | null;
  };
  is_saved?: boolean;
  is_liked?: boolean;
}