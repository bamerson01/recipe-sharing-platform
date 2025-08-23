-- Fix the update_follow_counts function to use followed_id instead of following_id

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the followed user
        UPDATE public.profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.followed_id;
        
        -- Increment following count for the follower
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count for the unfollowed user
        UPDATE public.profiles 
        SET follower_count = GREATEST(0, follower_count - 1)
        WHERE id = OLD.followed_id;
        
        -- Decrement following count for the unfollower
        UPDATE public.profiles 
        SET following_count = GREATEST(0, following_count - 1)
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
SELECT proname, prosrc FROM pg_proc WHERE proname = 'update_follow_counts';