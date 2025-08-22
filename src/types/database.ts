export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          avatar_key: string | null;
          bio: string | null;
          follower_count: number;
          following_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_key?: string | null;
          bio?: string | null;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_key?: string | null;
          bio?: string | null;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      recipes: {
        Row: {
          id: number;
          author_id: string;
          title: string;
          slug: string;
          summary: string | null;
          cover_image_key: string | null;
          is_public: boolean;
          like_count: number;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          prep_time: number | null;
          cook_time: number | null;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          author_id: string;
          title: string;
          slug: string;
          summary?: string | null;
          cover_image_key?: string | null;
          is_public?: boolean;
          like_count?: number;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          prep_time?: number | null;
          cook_time?: number | null;
          search_vector?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          author_id?: string;
          title?: string;
          slug?: string;
          summary?: string | null;
          cover_image_key?: string | null;
          is_public?: boolean;
          like_count?: number;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          prep_time?: number | null;
          cook_time?: number | null;
          search_vector?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipe_ingredients: {
        Row: {
          id: number;
          recipe_id: number;
          position: number;
          text: string;
        };
        Insert: {
          id?: number;
          recipe_id: number;
          position: number;
          text: string;
        };
        Update: {
          id?: number;
          recipe_id?: number;
          position?: number;
          text?: string;
        };
      };
      recipe_steps: {
        Row: {
          id: number;
          recipe_id: number;
          position: number;
          text: string;
        };
        Insert: {
          id?: number;
          recipe_id: number;
          position: number;
          text: string;
        };
        Update: {
          id?: number;
          recipe_id?: number;
          position?: number;
          text?: string;
        };
      };
      recipe_categories: {
        Row: {
          recipe_id: number;
          category_id: number;
        };
        Insert: {
          recipe_id: number;
          category_id: number;
        };
        Update: {
          recipe_id?: number;
          category_id?: number;
        };
      };
      likes: {
        Row: {
          id: number;
          recipe_id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          recipe_id: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          recipe_id?: number;
          user_id?: string;
          created_at?: string;
        };
      };
      saves: {
        Row: {
          id: number;
          recipe_id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          recipe_id: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          recipe_id?: number;
          user_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: number;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      recipe_comments: {
        Row: {
          id: string;
          recipe_id: number;
          user_id: string;
          parent_id: string | null;
          body: string;
          is_edited: boolean;
          edited_at: string | null;
          like_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: number;
          user_id: string;
          parent_id?: string | null;
          body: string;
          is_edited?: boolean;
          edited_at?: string | null;
          like_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: number;
          user_id?: string;
          parent_id?: string | null;
          body?: string;
          is_edited?: boolean;
          edited_at?: string | null;
          like_count?: number;
          created_at?: string;
        };
      };
      comment_likes: {
        Row: {
          id: number;
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          comment_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
