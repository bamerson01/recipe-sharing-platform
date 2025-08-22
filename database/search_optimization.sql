-- Search optimization for recipes
-- Add full-text search vector to recipes table

-- Update recipes table to include search vector for title + summary
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(summary, '')), 'B')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_recipes_search_vector ON public.recipes USING GIN(search_vector);

-- Create function to search recipes with ingredients
CREATE OR REPLACE FUNCTION search_recipes(
  search_query text,
  category_ids int[] DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE(
  id int,
  title text,
  slug text,
  summary text,
  cover_image_key text,
  is_public boolean,
  like_count int,
  created_at timestamptz,
  updated_at timestamptz,
  search_rank float4,
  author_id text,
  author_display_name text,
  author_username text,
  author_avatar_key text,
  categories jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.slug,
    r.summary,
    r.cover_image_key,
    r.is_public,
    r.like_count,
    r.created_at,
    r.updated_at,
    CASE 
      WHEN search_query IS NULL OR search_query = '' THEN 0
      ELSE ts_rank(r.search_vector, plainto_tsquery('english', search_query))
    END as search_rank,
    p.id as author_id,
    p.display_name as author_display_name,
    p.username as author_username,
    p.avatar_key as author_avatar_key,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) as categories
  FROM public.recipes r
  INNER JOIN public.profiles p ON r.author_id = p.id
  LEFT JOIN public.recipe_categories rc ON r.id = rc.recipe_id
  LEFT JOIN public.categories c ON rc.category_id = c.id
  LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
  WHERE r.is_public = true
    AND (
      search_query IS NULL 
      OR search_query = ''
      OR r.search_vector @@ plainto_tsquery('english', search_query)
      OR r.title ILIKE '%' || search_query || '%'
      OR r.summary ILIKE '%' || search_query || '%'
      OR ri.text ILIKE '%' || search_query || '%'
    )
    AND (
      category_ids IS NULL 
      OR array_length(category_ids, 1) IS NULL
      OR c.id = ANY(category_ids)
    )
  GROUP BY r.id, p.id, p.display_name, p.username, p.avatar_key
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN r.created_at
      WHEN sort_by = 'top' THEN r.like_count
      ELSE search_rank
    END DESC,
    r.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create index for ingredient text search
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_text ON public.recipe_ingredients USING GIN(to_tsvector('english', text));

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_recipe_categories_category_id ON public.recipe_categories(category_id);

-- Create index for sorting by like_count
CREATE INDEX IF NOT EXISTS idx_recipes_like_count_created ON public.recipes(like_count DESC, created_at DESC) WHERE is_public = true;

-- Create index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC) WHERE is_public = true;
