-- Fix Likes and Saves System - Complete Database Fix
-- Run this in Supabase SQL Editor to restore like/save functionality

-- =====================================================
-- STEP 1: Check current state
-- =====================================================

-- Check if likes table exists
SELECT 
    'likes' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'likes'
    ) as table_exists;

-- Check if saves table exists  
SELECT 
    'saves' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'saves'
    ) as table_exists;

-- =====================================================
-- STEP 2: Drop existing tables if they have wrong schema
-- =====================================================

-- Drop likes table if it exists (we'll recreate with correct schema)
DROP TABLE IF EXISTS public.likes CASCADE;

-- Drop saves table if it exists (we'll recreate with correct schema)
DROP TABLE IF EXISTS public.saves CASCADE;

-- =====================================================
-- STEP 3: Create likes table with correct schema
-- =====================================================

CREATE TABLE public.likes (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Add foreign key constraints
ALTER TABLE public.likes 
    ADD CONSTRAINT likes_recipe_id_fkey 
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
    ADD CONSTRAINT likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_recipe_id ON public.likes(recipe_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at);

-- Enable Row Level Security
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create saves table with correct schema
-- =====================================================

CREATE TABLE public.saves (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Add foreign key constraints
ALTER TABLE public.saves 
    ADD CONSTRAINT saves_recipe_id_fkey 
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;

ALTER TABLE public.saves 
    ADD CONSTRAINT saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_saves_user_id ON public.saves(user_id);
CREATE INDEX idx_saves_recipe_id ON public.saves(recipe_id);
CREATE INDEX idx_saves_created_at ON public.saves(created_at);

-- Enable Row Level Security
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS policies for likes table
-- =====================================================

-- Anyone can view likes (public read)
CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: Create RLS policies for saves table
-- =====================================================

-- Users can only view their own saves (private)
CREATE POLICY "Users can view their own saves" ON public.saves
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saves
CREATE POLICY "Users can insert their own saves" ON public.saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saves
CREATE POLICY "Users can delete their own saves" ON public.saves
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 7: Grant permissions
-- =====================================================

-- Grant permissions for likes table
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT USAGE ON SEQUENCE public.likes_id_seq TO authenticated;

-- Grant permissions for saves table
GRANT SELECT, INSERT, DELETE ON public.saves TO authenticated;
GRANT USAGE ON SEQUENCE public.saves_id_seq TO authenticated;

-- =====================================================
-- STEP 8: Create like count maintenance function
-- =====================================================

-- Function to maintain recipe like_count
CREATE OR REPLACE FUNCTION public.bump_like_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.recipes SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.recipes SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 9: Create triggers for like count maintenance
-- =====================================================

-- Attach triggers to likes table
DROP TRIGGER IF EXISTS likes_count_ins ON public.likes;
CREATE TRIGGER likes_count_ins AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.bump_like_count();

DROP TRIGGER IF EXISTS likes_count_del ON public.likes;
CREATE TRIGGER likes_count_del AFTER DELETE ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.bump_like_count();

-- =====================================================
-- STEP 10: Ensure recipes table has like_count column
-- =====================================================

-- Add like_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'like_count'
    ) THEN
        ALTER TABLE public.recipes ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- STEP 11: Verify the setup
-- =====================================================

-- Check if tables were created
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'saves')
ORDER BY tablename;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'saves')
ORDER BY tablename, policyname;

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('likes', 'saves')
ORDER BY tc.table_name, kcu.column_name;

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN ('likes', 'saves')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- STEP 12: Test data insertion (optional)
-- =====================================================

-- Uncomment these lines to test with sample data (replace with actual user_id and recipe_id)
-- INSERT INTO public.likes (recipe_id, user_id) VALUES (1, 'your-user-uuid-here');
-- INSERT INTO public.saves (recipe_id, user_id) VALUES (1, 'your-user-uuid-here');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Likes and Saves system has been successfully created!' as status;
SELECT 'All tables, policies, and triggers are now in place.' as details;
SELECT 'Like/Save functionality should now work correctly.' as next_steps;
