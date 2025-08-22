-- Verify Likes and Saves System Fixes
-- Run this after applying the main fix script to verify everything is working

-- =====================================================
-- VERIFICATION 1: Check if tables exist
-- =====================================================

SELECT 
    'Table Check' as verification_step,
    'likes' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'likes'
    ) as exists,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'likes'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
UNION ALL
SELECT 
    'Table Check' as verification_step,
    'saves' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'saves'
    ) as exists,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'saves'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status;

-- =====================================================
-- VERIFICATION 2: Check table structure
-- =====================================================

-- Check likes table structure
SELECT 
    'Likes Table Structure' as verification_step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'likes'
ORDER BY ordinal_position;

-- Check saves table structure
SELECT 
    'Saves Table Structure' as verification_step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'saves'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICATION 3: Check foreign key constraints
-- =====================================================

SELECT 
    'Foreign Key Constraints' as verification_step,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name = 'auth.users' AND kcu.column_name = 'user_id' THEN '✅ CORRECT'
        WHEN ccu.table_name = 'public.recipes' AND kcu.column_name = 'recipe_id' THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as constraint_status
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

-- =====================================================
-- VERIFICATION 4: Check RLS policies
-- =====================================================

SELECT 
    'RLS Policies' as verification_step,
    tablename,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN tablename = 'likes' AND cmd = 'SELECT' THEN '✅ Public read'
        WHEN tablename = 'likes' AND cmd = 'INSERT' THEN '✅ Owner insert'
        WHEN tablename = 'likes' AND cmd = 'DELETE' THEN '✅ Owner delete'
        WHEN tablename = 'saves' AND cmd = 'SELECT' THEN '✅ Owner read'
        WHEN tablename = 'saves' AND cmd = 'INSERT' THEN '✅ Owner insert'
        WHEN tablename = 'saves' AND cmd = 'DELETE' THEN '✅ Owner delete'
        ELSE '❌ Unexpected policy'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('likes', 'saves')
ORDER BY tablename, policyname;

-- =====================================================
-- VERIFICATION 5: Check triggers
-- =====================================================

SELECT 
    'Triggers' as verification_step,
    trigger_name,
    event_manipulation,
    event_object_table,
    CASE 
        WHEN trigger_name LIKE '%likes_count%' THEN '✅ Like count maintenance'
        ELSE '❌ Unexpected trigger'
    END as trigger_status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN ('likes', 'saves')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- VERIFICATION 6: Check like_count column in recipes
-- =====================================================

SELECT 
    'Recipes Table' as verification_step,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'like_count' THEN '✅ Like count column exists'
        ELSE 'ℹ️ Other column'
    END as column_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'recipes' 
    AND column_name = 'like_count';

-- =====================================================
-- VERIFICATION 7: Check permissions
-- =====================================================

SELECT 
    'Permissions' as verification_step,
    table_name,
    privilege_type,
    grantee,
    CASE 
        WHEN privilege_type IN ('SELECT', 'INSERT', 'DELETE') AND grantee = 'authenticated' THEN '✅ Correct permissions'
        ELSE '❌ Incorrect permissions'
    END as permission_status
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('likes', 'saves')
    AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- =====================================================
-- VERIFICATION 8: Test data insertion (if you have test data)
-- =====================================================

-- This section is for testing with actual data
-- Replace the UUIDs with actual values from your database

-- Check if there are any recipes to test with
SELECT 
    'Test Data Available' as verification_step,
    COUNT(*) as recipe_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Recipes available for testing'
        ELSE '❌ No recipes available for testing'
    END as status
FROM public.recipes;

-- Check if there are any authenticated users
SELECT 
    'Test Users Available' as verification_step,
    COUNT(*) as user_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Users available for testing'
        ELSE '❌ No users available for testing'
    END as status
FROM auth.users;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT 
    'SUMMARY REPORT' as report_type,
    'Run the main fix script if any verifications failed' as recommendation,
    'Check the status column for ✅ PASS or ❌ FAIL indicators' as next_steps,
    'All verifications should show ✅ status for full functionality' as expected_result;
