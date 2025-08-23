export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: number
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: number
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: number
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: number
          recipe_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          recipe_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          recipe_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          username: string | null
        }
        Insert: {
          avatar_key?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id: string
          username?: string | null
        }
        Update: {
          avatar_key?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      recipe_categories: {
        Row: {
          category_id: number
          recipe_id: number
        }
        Insert: {
          category_id: number
          recipe_id: number
        }
        Update: {
          category_id?: number
          recipe_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_categories_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_comment_images: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          image_key: string
          uploaded_by: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          image_key: string
          uploaded_by?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          image_key?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comment_images_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comment_images_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comment_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_comments: {
        Row: {
          body: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          like_count: number | null
          parent_id: string | null
          recipe_id: number | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          recipe_id?: number | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          recipe_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_images: {
        Row: {
          created_at: string | null
          id: string
          image_key: string
          recipe_id: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_key: string
          recipe_id?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_key?: string
          recipe_id?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_images_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: number
          position: number
          recipe_id: number | null
          text: string
        }
        Insert: {
          id?: number
          position: number
          recipe_id?: number | null
          text: string
        }
        Update: {
          id?: number
          position?: number
          recipe_id?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          id: number
          position: number
          recipe_id: number | null
          text: string
        }
        Insert: {
          id?: number
          position: number
          recipe_id?: number | null
          text: string
        }
        Update: {
          id?: number
          position?: number
          recipe_id?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_id: string
          cook_time: number | null
          cover_image_key: string | null
          created_at: string | null
          difficulty: string | null
          id: number
          is_public: boolean | null
          like_count: number | null
          prep_time: number | null
          search_vector: unknown | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          cook_time?: number | null
          cover_image_key?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: number
          is_public?: boolean | null
          like_count?: number | null
          prep_time?: number | null
          search_vector?: unknown | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          cook_time?: number | null
          cover_image_key?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: number
          is_public?: boolean | null
          like_count?: number | null
          prep_time?: number | null
          search_vector?: unknown | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string | null
          id: number
          recipe_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          recipe_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          recipe_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      follower_profiles: {
        Row: {
          created_at: string | null
          follower_avatar_key: string | null
          follower_display_name: string | null
          follower_id: string | null
          follower_username: string | null
          following_avatar_key: string | null
          following_display_name: string | null
          following_id: string | null
          following_username: string | null
          id: number | null
        }
        Relationships: []
      }
      recipe_comments_with_author: {
        Row: {
          avatar_key: string | null
          body: string | null
          created_at: string | null
          display_name: string | null
          edited_at: string | null
          id: string | null
          is_edited: boolean | null
          is_liked_by_user: boolean | null
          like_count: number | null
          parent_id: string | null
          recipe_id: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_username_available: {
        Args: { proposed_username: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
