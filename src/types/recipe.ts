// Standardized data contracts for recipes

export interface Author {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_key: string | null;
}

export interface CategoryMini {
  id: number;
  name: string;
  slug: string;
}

// List shape - minimal data for cards
export interface RecipeSummary {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  cover_image_key: string | null;
  like_count: number;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  prep_time: number | null;
  cook_time: number | null;
  author: Author;
  categories: CategoryMini[];
  updated_at: string;
  created_at: string;
  is_public: boolean;
  // Optional user-specific fields
  is_saved?: boolean;
  is_liked?: boolean;
}

// Full shape - complete data for detail view/modal
export interface RecipeFull extends RecipeSummary {
  ingredients: Array<{
    id: number;
    position: number;
    text: string;
  }>;
  steps: Array<{
    id: number;
    position: number;
    text: string;
  }>;
  // Future: additional images
  images?: Array<{
    id: number;
    key: string;
    caption?: string | null;
  }>;
}

// Props for unified components
export interface RecipeCardProps {
  recipe: RecipeSummary;
  variant?: 'default' | 'owner';
  onOpenModal?: (recipe: RecipeSummary) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleVisibility?: (id: number, isPublic: boolean) => void;
  onSaveChange?: (id: number, saved: boolean) => void;
}

export interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number | null;
  variant?: 'default' | 'owner';
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleVisibility?: (id: number, isPublic: boolean) => void;
  onSaveChange?: (id: number, saved: boolean) => void;
}