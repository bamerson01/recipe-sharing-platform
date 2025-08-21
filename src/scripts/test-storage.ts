#!/usr/bin/env tsx

/**
 * Test Storage Structure Script for RecipeNest
 * 
 * This script tests the new public-media bucket structure and utilities.
 * Run with: npx tsx src/scripts/test-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import {
  BUCKET,
  buildAvatarKey,
  buildRecipeCoverKey,
  buildRecipeOriginalKey,
  buildCommentImageKey,
  generateULID,
  getFileExtension,
  sanitizeBase
} from '../lib/storage';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageStructure() {
  console.log('🧪 Testing new storage structure...\n');

  try {
    // 1. Test bucket exists
    console.log('1. Checking public-media bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const publicMediaBucket = buckets?.find(b => b.name === BUCKET);

    if (publicMediaBucket) {
      console.log('✅ public-media bucket exists');
    } else {
      console.log('❌ public-media bucket not found');
      return;
    }

    // 2. Test storage utilities
    console.log('\n2. Testing storage utilities...');

    const testUserId = 'test-user-123';
    const testRecipeId = '456';
    const testCommentId = '789';
    const testFilename = 'test-image.jpg';
    const ulid = generateULID();

    console.log('Generated ULID:', ulid);
    console.log('File extension:', getFileExtension(testFilename));
    console.log('Sanitized base:', sanitizeBase('Test Image File!'));

    const avatarKey = buildAvatarKey(testUserId, 'test-avatar', ulid, 'jpg');
    const recipeCoverKey = buildRecipeCoverKey(testRecipeId, ulid, 'jpg');
    const recipeOriginalKey = buildRecipeOriginalKey(testRecipeId, 'test-recipe', ulid, 'jpg');
    const commentImageKey = buildCommentImageKey(testRecipeId, testCommentId, 'test-comment', ulid, 'jpg');

    console.log('Avatar key:', avatarKey);
    console.log('Recipe cover key:', recipeCoverKey);
    console.log('Recipe original key:', recipeOriginalKey);
    console.log('Comment image key:', commentImageKey);

    // 3. Test folder structure
    console.log('\n3. Testing folder structure...');

    const { data: rootFiles, error: rootError } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 10 });

    if (rootError) {
      console.log('❌ Error listing root files:', rootError.message);
    } else {
      console.log('✅ Root folder accessible');
      console.log('Root contents:', rootFiles?.map(f => f.name) || []);
    }

    // 4. Test avatars folder
    console.log('\n4. Testing avatars folder...');

    const { data: avatarFiles, error: avatarError } = await supabase.storage
      .from(BUCKET)
      .list('avatars', { limit: 10 });

    if (avatarError) {
      console.log('ℹ️  Avatars folder not created yet (this is normal)');
    } else {
      console.log('✅ Avatars folder accessible');
      console.log('Avatar contents:', avatarFiles?.map(f => f.name) || []);
    }

    // 5. Test recipes folder
    console.log('\n5. Testing recipes folder...');

    const { data: recipeFiles, error: recipeError } = await supabase.storage
      .from(BUCKET)
      .list('recipes', { limit: 10 });

    if (recipeError) {
      console.log('ℹ️  Recipes folder not created yet (this is normal)');
    } else {
      console.log('✅ Recipes folder accessible');
      console.log('Recipe contents:', recipeFiles?.map(f => f.name) || []);
    }

    console.log('\n🎉 Storage structure test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the migration script in Supabase SQL editor');
    console.log('2. Test avatar upload in the app');
    console.log('3. Test recipe creation with new storage structure');

  } catch (error) {
    console.error('❌ Error testing storage structure:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testStorageStructure();
}
