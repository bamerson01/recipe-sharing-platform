-- Following System Migration
-- This adds the ability for users to follow other users

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure users can't follow themselves
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    -- Ensure unique follow relationship
    UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- Add follower and following counts to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
-- Anyone can view follows (to see follower/following lists)
CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

-- Users can only create their own follow relationships
CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follow relationships
CREATE POLICY "Users can unfollow" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION public.update_follow_counts() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the followed user
        UPDATE public.profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.following_id;
        
        -- Increment following count for the follower
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count for the unfollowed user
        UPDATE public.profiles 
        SET follower_count = GREATEST(0, follower_count - 1)
        WHERE id = OLD.following_id;
        
        -- Decrement following count for the unfollower
        UPDATE public.profiles 
        SET following_count = GREATEST(0, following_count - 1)
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for follow count maintenance
CREATE TRIGGER update_follow_counts_on_insert
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_follow_counts();

CREATE TRIGGER update_follow_counts_on_delete
    AFTER DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_follow_counts();

-- Create a view for follower relationships with profile info
CREATE OR REPLACE VIEW public.follower_profiles AS
SELECT 
    f.id,
    f.follower_id,
    f.following_id,
    f.created_at,
    follower.username as follower_username,
    follower.display_name as follower_display_name,
    follower.avatar_key as follower_avatar_key,
    following.username as following_username,
    following.display_name as following_display_name,
    following.avatar_key as following_avatar_key
FROM public.follows f
JOIN public.profiles follower ON f.follower_id = follower.id
JOIN public.profiles following ON f.following_id = following.id;

-- Grant permissions
GRANT SELECT ON public.follower_profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT USAGE ON SEQUENCE public.follows_id_seq TO authenticated;