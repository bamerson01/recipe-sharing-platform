-- Enhanced Comments System
-- Improvements to the existing recipe_comments table

-- Add reply functionality to comments (nested comments)
ALTER TABLE public.recipe_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.recipe_comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON public.recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.recipe_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.recipe_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.recipe_comments(created_at DESC);

-- Create comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.recipe_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes for comment likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable RLS on comment likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment likes
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Update the RLS policies for recipe_comments to be more specific
DROP POLICY IF EXISTS recipe_comments_read ON public.recipe_comments;
DROP POLICY IF EXISTS recipe_comments_write ON public.recipe_comments;

-- Anyone can read comments on public recipes, only author can read on private
CREATE POLICY "Read comments on accessible recipes" ON public.recipe_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id 
            AND (r.is_public = true OR r.author_id = auth.uid())
        )
    );

-- Authenticated users can create comments on accessible recipes
CREATE POLICY "Create comments on accessible recipes" ON public.recipe_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id 
            AND (r.is_public = true OR r.author_id = auth.uid())
        )
    );

-- Users can update their own comments
CREATE POLICY "Update own comments" ON public.recipe_comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, recipe authors can delete any comment on their recipe
CREATE POLICY "Delete own comments or comments on own recipes" ON public.recipe_comments
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id 
            AND r.author_id = auth.uid()
        )
    );

-- Function to update comment like counts
CREATE OR REPLACE FUNCTION public.update_comment_like_count() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.recipe_comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.recipe_comments 
        SET like_count = GREATEST(0, like_count - 1)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment like count maintenance
CREATE TRIGGER update_comment_likes_on_insert
    AFTER INSERT ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comment_like_count();

CREATE TRIGGER update_comment_likes_on_delete
    AFTER DELETE ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comment_like_count();

-- Function to mark comment as edited
CREATE OR REPLACE FUNCTION public.mark_comment_edited() 
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.body != NEW.body THEN
        NEW.is_edited = TRUE;
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to mark comments as edited
CREATE TRIGGER mark_comment_as_edited
    BEFORE UPDATE ON public.recipe_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_comment_edited();

-- Create a view for comments with user info
CREATE OR REPLACE VIEW public.recipe_comments_with_author AS
SELECT 
    c.id,
    c.recipe_id,
    c.user_id,
    c.parent_id,
    c.body,
    c.is_edited,
    c.edited_at,
    c.like_count,
    c.created_at,
    p.username,
    p.display_name,
    p.avatar_key,
    -- Check if current user has liked this comment
    EXISTS (
        SELECT 1 FROM public.comment_likes cl 
        WHERE cl.comment_id = c.id 
        AND cl.user_id = auth.uid()
    ) as is_liked_by_user
FROM public.recipe_comments c
JOIN public.profiles p ON c.user_id = p.id;

-- Grant permissions
GRANT SELECT ON public.recipe_comments_with_author TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT USAGE ON SEQUENCE public.comment_likes_id_seq TO authenticated;