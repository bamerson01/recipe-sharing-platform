# Current Database Schema Documentation

**Last Updated:** [Date]
**Database:** [Your Supabase Project Name]
**Environment:** [Production/Development]

## 📋 Instructions

1. **Run the SQL script**: Copy and paste the contents of `database/extract-current-schema.sql` into your Supabase SQL Editor
2. **Execute each section**: Run the queries one by one to get the current state
3. **Fill in this document**: Use the results to populate the sections below
4. **Save and commit**: This will serve as your current database reference

---

## 🗂️ Database Tables

### Table: `profiles`
- **Purpose**: User profile information
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `recipes`
- **Purpose**: Recipe information
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `categories`
- **Purpose**: Recipe categories
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `recipe_ingredients`
- **Purpose**: Recipe ingredient details
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `recipe_steps`
- **Purpose**: Recipe cooking steps
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `recipe_categories`
- **Purpose**: Many-to-many relationship between recipes and categories
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `likes`
- **Purpose**: User recipe likes
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]
- **Status**: [Exists/Doesn't Exist] ⚠️ **CRITICAL FOR LIKE FUNCTIONALITY**

### Table: `saves`
- **Purpose**: User recipe bookmarks
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]
- **Status**: [Exists/Doesn't Exist] ⚠️ **CRITICAL FOR SAVE FUNCTIONALITY**

### Table: `recipe_comments`
- **Purpose**: Recipe comments
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

### Table: `recipe_comment_images`
- **Purpose**: Images attached to recipe comments
- **Columns**: [Fill in from SQL results]
- **Constraints**: [Fill in from SQL results]
- **Foreign Keys**: [Fill in from SQL results]
- **RLS Status**: [Enabled/Disabled]
- **Row Count**: [Fill in from SQL results]

---

## 🔐 Row Level Security (RLS) Policies

### Profiles Table Policies
[Fill in from SQL results]

### Recipes Table Policies
[Fill in from SQL results]

### Likes Table Policies
[Fill in from SQL results] ⚠️ **CRITICAL FOR LIKE FUNCTIONALITY**

### Saves Table Policies
[Fill in from SQL results] ⚠️ **CRITICAL FOR SAVE FUNCTIONALITY**

### Categories Table Policies
[Fill in from SQL results]

### Recipe Ingredients Table Policies
[Fill in from SQL results]

### Recipe Steps Table Policies
[Fill in from SQL results]

---

## ⚙️ Database Functions

[Fill in from SQL results - look for functions like `set_recipes_search_vector`, `touch_updated_at`, `bump_like_count`]

---

## 🔔 Database Triggers

[Fill in from SQL results - look for triggers like `recipes_tsv`, `recipes_touch`, `likes_count_ins`, `likes_count_del`]

---

## 📊 Database Indexes

[Fill in from SQL results - look for indexes like `recipes_search_gin`, `recipes_title_trgm`, `idx_saves_user_id`]

---

## 🔢 Sequences

[Fill in from SQL results - look for sequences like `profiles_id_seq`, `recipes_id_seq`, `likes_id_seq`]

---

## 🚨 Critical Issues Identified

### 1. Missing Tables
- [ ] `likes` table exists
- [ ] `saves` table exists
- [ ] All required tables are present

### 2. Schema Mismatches
- [ ] `likes.user_id` references `auth.users(id)` (not `profiles(id)`)
- [ ] `saves.user_id` references `auth.users(id)` (not `profiles(id)`)
- [ ] Foreign key constraints are correct

### 3. RLS Policies
- [ ] RLS enabled on all tables
- [ ] Appropriate policies exist for likes/saves
- [ ] Policies allow authenticated users to read/write

### 4. Functions and Triggers
- [ ] `bump_like_count` function exists
- [ ] Like count triggers are attached to likes table
- [ ] Search vector triggers are working

---

## 📝 Action Items

### Immediate (High Priority)
1. [ ] Verify `likes` table exists and has correct schema
2. [ ] Verify `saves` table exists and has correct schema
3. [ ] Check foreign key references match API expectations
4. [ ] Verify RLS policies allow proper access

### Short Term (Medium Priority)
1. [ ] Run missing database migrations
2. [ ] Fix any schema mismatches
3. [ ] Test like/save functionality
4. [ ] Verify all triggers are working

### Long Term (Low Priority)
1. [ ] Optimize database indexes
2. [ ] Review and optimize RLS policies
3. [ ] Add database monitoring
4. [ ] Create automated schema validation

---

## 🔍 Troubleshooting Notes

### Like/Save 404 Errors
- **Symptoms**: API endpoints return 404 for `/api/recipes/[id]/like` and `/api/recipes/[id]/save`
- **Possible Causes**:
  1. Tables don't exist
  2. RLS policies blocking access
  3. Foreign key constraint issues
  4. Missing database functions/triggers

### Database Connection Issues
- **Symptoms**: API errors, missing data
- **Possible Causes**:
  1. Environment variables incorrect
  2. Database permissions
  3. Network connectivity
  4. Supabase service status

---

## 📚 Related Files

- `database/extract-current-schema.sql` - SQL script to extract current schema
- `database/saves_table.sql` - Saves table creation script
- `database/username_onboarding_migration.sql` - Username migration script
- `src/app/api/recipes/[id]/like/route.ts` - Like API endpoint
- `src/app/api/recipes/[id]/save/route.ts` - Save API endpoint

---

## 🎯 Next Steps

1. **Run the schema extraction script** in Supabase SQL Editor
2. **Fill in this document** with the actual results
3. **Identify missing tables/policies** that need to be created
4. **Fix schema mismatches** between code and database
5. **Test like/save functionality** after fixes
6. **Update this document** as changes are made

---

**Note**: This document should be updated whenever database changes are made to maintain an accurate record of the current schema state.
