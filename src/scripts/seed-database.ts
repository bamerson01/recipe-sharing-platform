#!/usr/bin/env tsx

/**
 * Database Seeding Script for RecipeNest
 * 
 * This script seeds the database with initial categories and test data.
 * Run with: npx tsx src/scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCategories() {
  // Check if categories already exist
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .limit(1);

  if (existingCategories && existingCategories.length > 0) {    return;
  }

  // Default categories
  const categories = [
    { name: 'Breakfast', slug: 'breakfast' },
    { name: 'Lunch', slug: 'lunch' },
    { name: 'Dinner', slug: 'dinner' },
    { name: 'Dessert', slug: 'dessert' },
    { name: 'Snacks', slug: 'snacks' },
    { name: 'Appetizers', slug: 'appetizers' },
    { name: 'Soups', slug: 'soups' },
    { name: 'Salads', slug: 'salads' },
    { name: 'Pasta', slug: 'pasta' },
    { name: 'Seafood', slug: 'seafood' },
    { name: 'Chicken', slug: 'chicken' },
    { name: 'Beef', slug: 'beef' },
    { name: 'Pork', slug: 'pork' },
    { name: 'Vegetarian', slug: 'vegetarian' },
    { name: 'Vegan', slug: 'vegan' },
    { name: 'Gluten-Free', slug: 'gluten-free' },
    { name: 'Keto', slug: 'keto' },
    { name: 'Paleo', slug: 'paleo' },
    { name: 'Quick & Easy', slug: 'quick-easy' },
    { name: 'Slow Cooker', slug: 'slow-cooker' },
    { name: 'One-Pot', slug: 'one-pot' },
    { name: 'Air Fryer', slug: 'air-fryer' },
    { name: 'Grilling', slug: 'grilling' },
    { name: 'Baking', slug: 'baking' },
    { name: 'Holiday', slug: 'holiday' },
    { name: 'Party', slug: 'party' },
    { name: 'Healthy', slug: 'healthy' },
    { name: 'Comfort Food', slug: 'comfort-food' },
    { name: 'International', slug: 'international' },
  ];

  const { error } = await supabase
    .from('categories')
    .insert(categories);

  if (error) {    throw error;
  }}

async function createStorageBucket() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const publicMediaBucket = buckets?.find(b => b.name === 'public-media');

    if (publicMediaBucket) {      return;
    }

    // Create bucket
    const { error } = await supabase.storage.createBucket('public-media', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });

    if (error) {      throw error;
    }
    // Note: RLS policies will be set via SQL in the schema
  } catch (error) {  }
}

async function main() {
  try {
    await seedCategories();
    await createStorageBucket();
  } catch (error) {    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
