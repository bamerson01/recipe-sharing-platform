export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
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
          image_path: string | null;
          is_public: boolean;
          like_count: number;
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
          image_path?: string | null;
          is_public?: boolean;
          like_count?: number;
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
          image_path?: string | null;
          is_public?: boolean;
          like_count?: number;
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
    };
  };
}
