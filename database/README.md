# Database Documentation & Schema Management

## 📁 **Files Created**

### 1. **`extract-current-schema.sql`** 
**Purpose**: SQL script to extract current database schema from Supabase
**Usage**: Copy and paste into Supabase SQL Editor, run section by section
**What it extracts**:
- All tables and their structure
- Foreign key relationships
- RLS policies
- Functions and triggers
- Indexes and sequences
- Table row counts

### 2. **`current-database-schema.md`**
**Purpose**: Comprehensive template for documenting current database state
**Usage**: Fill in with results from the SQL extraction script
**Sections**:
- Table structures and relationships
- RLS policies
- Functions and triggers
- Critical issues checklist
- Action items and troubleshooting

### 3. **`CRITICAL_ISSUES.md`**
**Purpose**: Immediate action guide for fixing like/save functionality
**Priority**: URGENT - Core app features broken
**Contains**:
- Step-by-step fixes
- SQL scripts to create missing tables
- Verification checklist
- Testing procedures

---

## 🚨 **IMMEDIATE ACTION REQUIRED**

### **Problem**: Like/Save functionality completely broken
- API endpoints return 404 errors
- Users cannot like or save recipes
- Core engagement features non-functional

### **Solution**: Run the critical fixes in `CRITICAL_ISSUES.md`

---

## 📋 **Step-by-Step Process**

### **Phase 1: Extract Current Schema**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `extract-current-schema.sql`
3. Run each section to get current database state
4. Document results in `current-database-schema.md`

### **Phase 2: Fix Critical Issues**
1. Follow `CRITICAL_ISSUES.md` step by step
2. Create missing `likes` and `saves` tables
3. Fix foreign key references
4. Set up RLS policies
5. Create necessary triggers

### **Phase 3: Verify Fixes**
1. Test like/save functionality
2. Check API endpoints return 200 (not 404)
3. Verify UI buttons work
4. Update documentation

---

## 🔍 **What to Look For**

### **Missing Tables**
- `likes` table for recipe likes
- `saves` table for recipe bookmarks

### **Schema Mismatches**
- Foreign keys referencing wrong tables
- Missing RLS policies
- Incorrect data types

### **Missing Functions/Triggers**
- `bump_like_count()` function
- Like count maintenance triggers
- Search vector triggers

---

## 📊 **Expected Database Structure**

### **Core Tables**
```
profiles (users)
├── recipes (user's recipes)
│   ├── recipe_ingredients
│   ├── recipe_steps
│   └── recipe_categories
├── likes (recipe likes)
├── saves (recipe bookmarks)
└── categories (recipe categories)
```

### **Key Relationships**
- `likes.user_id` → `auth.users(id)` ⚠️ **CRITICAL**
- `saves.user_id` → `auth.users(id)` ⚠️ **CRITICAL**
- `recipes.author_id` → `profiles(id)`
- `likes.recipe_id` → `recipes(id)`
- `saves.recipe_id` → `recipes(id)`

---

## 🛠️ **Tools & Scripts**

### **Schema Extraction**
- `extract-current-schema.sql` - Get current state
- `current-database-schema.md` - Document findings

### **Fix Scripts**
- `CRITICAL_ISSUES.md` - Immediate fixes
- `saves_table.sql` - Saves table creation
- `username_onboarding_migration.sql` - User migration

### **Verification**
- API endpoint testing
- UI functionality testing
- Database constraint checking

---

## 📞 **Getting Help**

### **If Scripts Don't Work**
1. Check Supabase service status
2. Verify environment variables
3. Check database permissions
4. Review error messages in SQL Editor

### **If Issues Persist**
1. Check Supabase logs
2. Test with fresh user account
3. Verify RLS policies
4. Check foreign key constraints

---

## 🎯 **Success Criteria**

After completing the fixes:
- ✅ Like buttons work on all recipe views
- ✅ Save buttons work on all recipe views
- ✅ No 404 errors on like/save endpoints
- ✅ Like counts update correctly
- ✅ Saved recipes appear in user dashboard
- ✅ All database constraints are satisfied
- ✅ RLS policies allow proper access

---

**Remember**: The like/save functionality is core to user engagement. Fixing this should be the top priority before adding new features.
