-- Storage bucket policies for public-media bucket

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-media',
  'public-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']::text[]
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']::text[];

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own images" ON storage.objects;

-- Create new policies for the public-media bucket

-- 1. Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-media' AND
  (
    -- Users can upload to their own folders
    (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text
    OR
    (storage.foldername(name))[1] = 'recipes' AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- 2. Allow public to view all images (since bucket is public)
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-media');

-- 3. Allow users to update their own images
CREATE POLICY "Allow users to update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public-media' AND
  (
    (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text
    OR
    (storage.foldername(name))[1] = 'recipes' AND (storage.foldername(name))[2] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'public-media' AND
  (
    (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text
    OR
    (storage.foldername(name))[1] = 'recipes' AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- 4. Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-media' AND
  (
    (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text
    OR
    (storage.foldername(name))[1] = 'recipes' AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';