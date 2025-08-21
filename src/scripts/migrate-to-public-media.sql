-- Migration script to update RecipeNest from recipe-images to public-media bucket
-- Run this in your Supabase SQL editor

-- 1. Create the new public-media bucket (if it doesn't exist)
-- Note: This needs to be done via Supabase dashboard or storage API
-- select storage.create_bucket('public-media', public => true);

-- 2. Update profiles table to use avatar_key instead of avatar_url
ALTER TABLE public.profiles 
RENAME COLUMN avatar_url TO avatar_key;

-- 3. Update recipes table to use cover_image_key instead of image_path
ALTER TABLE public.recipes 
RENAME COLUMN image_path TO cover_image_key;

-- 4. Create new tables for enhanced functionality
CREATE TABLE IF NOT EXISTS public.recipe_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id bigint REFERENCES public.recipes(id) ON DELETE CASCADE,
  image_key text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id bigint REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_comment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.recipe_comments(id) ON DELETE CASCADE,
  image_key text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on new tables
ALTER TABLE public.recipe_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_comment_images ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for new tables
CREATE POLICY recipe_images_read ON public.recipe_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.author_id = auth.uid()))
);

CREATE POLICY recipe_images_write ON public.recipe_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.author_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.author_id = auth.uid())
);

CREATE POLICY recipe_comments_read ON public.recipe_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.author_id = auth.uid()))
);

CREATE POLICY recipe_comments_write ON public.recipe_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.author_id = auth.uid()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.author_id = auth.uid()))
);

CREATE POLICY recipe_comment_images_read ON public.recipe_comment_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipe_comments rc 
          JOIN public.recipes r ON rc.recipe_id = r.id 
          WHERE rc.id = comment_id AND (r.is_public OR r.author_id = auth.uid()))
);

CREATE POLICY recipe_comment_images_write ON public.recipe_comment_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.recipe_comments rc 
          JOIN public.recipes r ON rc.recipe_id = r.id 
          WHERE rc.id = comment_id AND (r.is_public OR r.author_id = auth.uid()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.recipe_comments rc 
          JOIN public.recipes r ON rc.recipe_id = r.id 
          WHERE rc.id = comment_id AND (r.is_public OR r.author_id = auth.uid()))
);

-- 7. Set storage policies (run these in Supabase dashboard)
-- Allow public read access to public-media bucket
-- create policy "public read public-media"
-- on storage.objects for select
-- using (bucket_id = 'public-media');

-- Block client writes (server-side only)
-- revoke insert on storage.objects from anon, authenticated;
-- revoke update on storage.objects from anon, authenticated;
-- revoke delete on storage.objects from anon, authenticated;

-- 8. Optional: Migrate existing data
-- If you have existing images in the old bucket, you'll need to:
-- 1. Download them from the old bucket
-- 2. Re-upload them to the new bucket with the new key structure
-- 3. Update the database records with new keys

-- Example migration for existing avatars (if any):
-- UPDATE public.profiles 
-- SET avatar_key = REPLACE(avatar_key, 'avatars/', 'avatars/' || id || '/2025/01/')
-- WHERE avatar_key IS NOT NULL AND avatar_key LIKE 'avatars/%';

-- Example migration for existing recipe images (if any):
-- UPDATE public.recipes 
-- SET cover_image_key = REPLACE(cover_image_key, 'recipes/', 'recipes/' || id || '/covers/')
-- WHERE cover_image_key IS NOT NULL AND cover_image_key LIKE 'recipes/%';

-- 9. Clean up old bucket (after confirming migration is successful)
-- DROP BUCKET IF EXISTS "recipe-images";

-- Note: Run this migration carefully and test thoroughly before running in production
