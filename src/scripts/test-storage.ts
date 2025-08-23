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

if (!supabaseUrl || !supabaseServiceKey) {  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageStructure() {
  try {
    // 1. Test bucket exists    const { data: buckets } = await supabase.storage.listBuckets();
    const publicMediaBucket = buckets?.find(b => b.name === BUCKET);

    if (publicMediaBucket) {    } else {      return;
    }

    // 2. Test storage utilities
    const testUserId = 'test-user-123';
    const testRecipeId = '456';
    const testCommentId = '789';
    const testFilename = 'test-image.jpg';
    const ulid = generateULID();
    const avatarKey = buildAvatarKey(testUserId, 'test-avatar', ulid, 'jpg');
    const recipeCoverKey = buildRecipeCoverKey(testRecipeId, ulid, 'jpg');
    const recipeOriginalKey = buildRecipeOriginalKey(testRecipeId, 'test-recipe', ulid, 'jpg');
    const commentImageKey = buildCommentImageKey(testRecipeId, testCommentId, 'test-comment', ulid, 'jpg');
    // 3. Test folder structure
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 10 });

    if (rootError) {    } else {    }

    // 4. Test avatars folder
    const { data: avatarFiles, error: avatarError } = await supabase.storage
      .from(BUCKET)
      .list('avatars', { limit: 10 });

    if (avatarError) {    } else {    }

    // 5. Test recipes folder
    const { data: recipeFiles, error: recipeError } = await supabase.storage
      .from(BUCKET)
      .list('recipes', { limit: 10 });

    if (recipeError) {    } else {    }
  } catch (error) {    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testStorageStructure();
}
