-- Fix missing foreign key constraints for follows and likes tables
-- This will allow Supabase to properly join these tables with profiles

-- Add foreign key constraint for follows.follower_id -> profiles.id
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for follows.followed_id -> profiles.id  
ALTER TABLE public.follows 
ADD CONSTRAINT follows_followed_id_fkey 
FOREIGN KEY (followed_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for likes.user_id -> profiles.id
ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for likes.recipe_id -> recipes.id
ALTER TABLE public.likes 
ADD CONSTRAINT likes_recipe_id_fkey 
FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;

-- Verify the constraints were added
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('follows', 'likes')
ORDER BY tc.table_name, tc.constraint_name;
