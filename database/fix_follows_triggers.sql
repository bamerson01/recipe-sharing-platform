-- Check for triggers on the follows table that might be using following_id
-- This script will help identify and fix any database-level issues

-- First, let's check what triggers exist on the follows table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'follows';

-- Check for any functions that might reference following_id
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM 
    pg_proc
WHERE 
    prosrc LIKE '%following_id%'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- If there's a trigger updating profile counts, it might look like this
-- and need to be fixed to use followed_id instead of following_id

-- Example of what the fixed trigger function should look like:
CREATE OR REPLACE FUNCTION update_profile_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update follower count for the user being followed
        UPDATE profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.followed_id;
        
        -- Update following count for the user doing the following
        UPDATE profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update follower count for the user being unfollowed
        UPDATE profiles 
        SET follower_count = GREATEST(0, follower_count - 1)
        WHERE id = OLD.followed_id;
        
        -- Update following count for the user doing the unfollowing
        UPDATE profiles 
        SET following_count = GREATEST(0, following_count - 1)
        WHERE id = OLD.follower_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- If you find a trigger using following_id, you can drop and recreate it:
-- DROP TRIGGER IF EXISTS update_profile_counts_trigger ON follows;
-- CREATE TRIGGER update_profile_counts_trigger
-- AFTER INSERT OR DELETE ON follows
-- FOR EACH ROW
-- EXECUTE FUNCTION update_profile_counts();