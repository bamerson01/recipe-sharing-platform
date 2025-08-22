# 🚨 CRITICAL DATABASE ISSUES - IMMEDIATE ACTION REQUIRED

## ⚠️ **Like/Save Functionality Completely Broken**

### **Problem Summary**
- Users cannot like or save recipes
- API endpoints return 404 errors
- Core engagement features non-functional

### **Root Cause**
The `likes` and `saves` tables either:
1. **Don't exist** in the database, OR
2. **Have incorrect schema** (wrong foreign key references), OR  
3. **Missing RLS policies** that block access

### **Evidence**
- Terminal logs show 404 errors on `/api/recipes/[id]/like` and `/api/recipes/[id]/save`
- Users report like/save buttons not working
- API calls fail with "Not Found" responses

---

## 🔧 **IMMEDIATE FIXES REQUIRED**

### **Step 1: Check if Tables Exist**
Run this in Supabase SQL Editor:
```sql
-- Check if likes table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'likes'
) as likes_exists;

-- Check if saves table exists  
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'saves'
) as saves_exists;
```

### **Step 2: If Tables Don't Exist - Create Them**

#### **Create Likes Table**
```sql
-- Create likes table for public recipe likes
CREATE TABLE IF NOT EXISTS public.likes (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_recipe_id ON public.likes(recipe_id);

-- Enable Row Level Security
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read; only owner can insert/delete
CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT USAGE ON SEQUENCE public.likes_id_seq TO authenticated;
```

#### **Create Saves Table**
```sql
-- Create saves table for private recipe bookmarks
CREATE TABLE IF NOT EXISTS public.saves (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_recipe_id ON public.saves(recipe_id);

-- Enable Row Level Security
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Owner-only read/insert/delete
CREATE POLICY "Users can view their own saves" ON public.saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves" ON public.saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON public.saves
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON public.saves TO authenticated;
GRANT USAGE ON SEQUENCE public.saves_id_seq TO authenticated;
```

### **Step 3: If Tables Exist But Have Wrong Schema**

#### **Fix Foreign Key References**
```sql
-- Fix likes table foreign key
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.likes ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix saves table foreign key  
ALTER TABLE public.saves DROP CONSTRAINT IF EXISTS saves_user_id_fkey;
ALTER TABLE public.saves ADD CONSTRAINT saves_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### **Step 4: Create Like Count Triggers**
```sql
-- Function to maintain recipe like_count
CREATE OR REPLACE FUNCTION public.bump_like_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.recipes SET like_count = like_count + 1 WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.recipes SET like_count = like_count - 1 WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- Attach triggers to likes table
DROP TRIGGER IF EXISTS likes_count_ins ON public.likes;
CREATE TRIGGER likes_count_ins AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.bump_like_count();

DROP TRIGGER IF EXISTS likes_count_del ON public.likes;
CREATE TRIGGER likes_count_del AFTER DELETE ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.bump_like_count();
```

---

## 🧪 **TESTING AFTER FIXES**

### **Test Like Functionality**
1. Go to `/explore` page
2. Try to like a recipe
3. Check browser network tab for successful API calls
4. Verify like count increases

### **Test Save Functionality**  
1. Go to `/explore` page
2. Try to save a recipe
3. Check browser network tab for successful API calls
4. Go to `/saved` page to verify recipe appears

### **Check API Endpoints**
```bash
# Test like endpoint
curl -X GET "http://localhost:3001/api/recipes/1/like"

# Test save endpoint  
curl -X GET "http://localhost:3001/api/recipes/1/save"
```

---

## 📊 **VERIFICATION CHECKLIST**

- [ ] `likes` table exists in database
- [ ] `saves` table exists in database
- [ ] Tables have correct foreign key references to `auth.users(id)`
- [ ] RLS policies allow authenticated users to read/write
- [ ] Like count triggers are attached and working
- [ ] API endpoints return 200 status (not 404)
- [ ] Like/save buttons work in UI
- [ ] Like counts update correctly
- [ ] Saved recipes appear in `/saved` page

---

## 🚀 **EXPECTED OUTCOME**

After applying these fixes:
- ✅ Like functionality fully restored
- ✅ Save functionality fully restored  
- ✅ Recipe engagement features working
- ✅ No more 404 errors on like/save endpoints
- ✅ Users can like and save recipes from any view
- ✅ Like counts update in real-time
- ✅ Saved recipes accessible from user dashboard

---

## 📞 **IF ISSUES PERSIST**

1. **Check Supabase logs** for detailed error messages
2. **Verify environment variables** are correct
3. **Check database permissions** for authenticated users
4. **Review RLS policies** for any overly restrictive rules
5. **Test with a fresh user account** to isolate issues

---

**Priority: URGENT** - This affects core app functionality and user experience.
