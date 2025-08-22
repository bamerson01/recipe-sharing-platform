# 🚀 **ACTION PLAN: Fix Likes & Saves System**

## 🎯 **Goal**
Restore like/save functionality by fixing database schema issues that are causing 404 errors.

## ⚠️ **Current Status**
- ❌ Like buttons not working
- ❌ Save buttons not working  
- ❌ API endpoints returning 404 errors
- ❌ Core engagement features broken

---

## 📋 **STEP-BY-STEP EXECUTION**

### **Phase 1: Apply Database Fixes (IMMEDIATE)**

#### **Step 1.1: Run Main Fix Script**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents of `database/fix_likes_saves_system.sql`
3. Paste into SQL Editor
4. **Click "Run"** to execute the entire script
5. **Wait for completion** (should take 10-30 seconds)

#### **Step 1.2: Verify Fixes Applied**
1. Copy contents of `database/verify_fixes.sql`
2. Paste into SQL Editor
3. **Click "Run"** to verify all fixes
4. **Look for ✅ PASS indicators** in results

#### **Expected Results:**
- ✅ `likes` table created with correct schema
- ✅ `saves` table created with correct schema
- ✅ Foreign keys reference `auth.users(id)` (not `profiles(id)`)
- ✅ RLS policies allow proper access
- ✅ Triggers maintain like counts
- ✅ All permissions granted correctly

---

### **Phase 2: Test Functionality**

#### **Step 2.1: Start Development Server**
```bash
npm run dev
```

#### **Step 2.2: Test Like Functionality**
1. Go to `/explore` page
2. Find a recipe with like button
3. **Click like button**
4. **Check browser console** for errors
5. **Check Network tab** for API calls
6. **Verify like count increases**

#### **Step 2.3: Test Save Functionality**
1. Stay on `/explore` page
2. Find a recipe with save button
3. **Click save button**
4. **Check browser console** for errors
5. **Check Network tab** for API calls
6. **Go to `/saved` page** to verify recipe appears

#### **Step 2.4: Test API Endpoints Directly**
```bash
# Test like endpoint (should return 200, not 404)
curl -X GET "http://localhost:3001/api/recipes/1/like"

# Test save endpoint (should return 200, not 404)
curl -X GET "http://localhost:3001/api/recipes/1/save"
```

---

### **Phase 3: Verify Complete Fix**

#### **Step 3.1: Check All Recipe Views**
- ✅ **Explore page** - like/save buttons work
- ✅ **Recipe cards** - like/save buttons work
- ✅ **Recipe modals** - like/save buttons work
- ✅ **Recipe detail pages** - like/save buttons work
- ✅ **User profile pages** - like/save buttons work

#### **Step 3.2: Check Database State**
- ✅ **Tables exist** with correct schema
- ✅ **Foreign keys** reference correct tables
- ✅ **RLS policies** allow proper access
- ✅ **Triggers** maintain data integrity
- ✅ **Permissions** granted correctly

---

## 🔧 **TROUBLESHOOTING**

### **If Fix Script Fails:**

#### **Error: "Permission denied"**
- **Solution**: Check if you're using the correct Supabase project
- **Solution**: Verify you have admin access to the database

#### **Error: "Table already exists"**
- **Solution**: The script handles this automatically with `DROP TABLE IF EXISTS`
- **Solution**: If issues persist, manually drop tables first

#### **Error: "Function already exists"**
- **Solution**: The script handles this with `CREATE OR REPLACE`
- **Solution**: This is normal and expected

### **If Verification Fails:**

#### **Tables don't exist after fix:**
- **Solution**: Re-run the fix script
- **Solution**: Check SQL Editor for error messages
- **Solution**: Verify you're in the correct database

#### **Foreign key constraints wrong:**
- **Solution**: The fix script recreates tables with correct constraints
- **Solution**: If issues persist, check if recipes table exists

#### **RLS policies missing:**
- **Solution**: Re-run the fix script
- **Solution**: Check if RLS is enabled on tables

---

## 📊 **SUCCESS INDICATORS**

### **Immediate Success (After Phase 1):**
- ✅ No SQL errors in Supabase SQL Editor
- ✅ Verification script shows all ✅ PASS indicators
- ✅ Tables created with correct structure

### **Functional Success (After Phase 2):**
- ✅ Like buttons work on all recipe views
- ✅ Save buttons work on all recipe views
- ✅ No 404 errors in browser console
- ✅ API endpoints return 200 status

### **Complete Success (After Phase 3):**
- ✅ All recipe views have working like/save functionality
- ✅ Like counts update correctly
- ✅ Saved recipes appear in user dashboard
- ✅ No database constraint violations
- ✅ All RLS policies working correctly

---

## 🚨 **EMERGENCY ROLLBACK**

### **If Something Goes Wrong:**
1. **Don't panic** - the fix script is designed to be safe
2. **Check Supabase logs** for specific error messages
3. **Re-run the fix script** - it's idempotent
4. **Contact support** if issues persist

### **Rollback Commands:**
```sql
-- Only if absolutely necessary
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.saves CASCADE;
DROP FUNCTION IF EXISTS public.bump_like_count() CASCADE;
```

---

## 📞 **GETTING HELP**

### **If You're Stuck:**
1. **Check the verification script results** for specific failures
2. **Look at Supabase SQL Editor error messages**
3. **Check browser console** for JavaScript errors
4. **Verify environment variables** are correct

### **Common Issues:**
- **Wrong database**: Make sure you're in the correct Supabase project
- **Permission issues**: Verify you have admin access
- **Network issues**: Check if Supabase is accessible
- **Script errors**: Copy/paste the entire script, don't modify it

---

## 🎯 **NEXT STEPS AFTER FIX**

1. **Test thoroughly** - like/save on all recipe views
2. **Update documentation** - mark issues as resolved
3. **Monitor performance** - check if like counts update correctly
4. **User testing** - have someone else test the functionality
5. **Plan next features** - once core functionality is restored

---

**Remember**: This fix script is designed to be safe and idempotent. You can run it multiple times if needed. The goal is to restore core app functionality so users can engage with recipes again.
