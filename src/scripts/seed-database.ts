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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  // Check if categories already exist
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .limit(1);

  if (existingCategories && existingCategories.length > 0) {
    console.log('✅ Categories already seeded, skipping...');
    return;
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

  if (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }

  console.log(`✅ Successfully seeded ${categories.length} categories`);
}

async function createStorageBucket() {
  console.log('🪣 Setting up storage bucket...');

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const publicMediaBucket = buckets?.find(b => b.name === 'public-media');

    if (publicMediaBucket) {
      console.log('✅ public-media bucket already exists');
      return;
    }

    // Create bucket
    const { error } = await supabase.storage.createBucket('public-media', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });

    if (error) {
      console.error('❌ Error creating storage bucket:', error);
      throw error;
    }

    console.log('✅ public-media bucket created successfully');

    // Note: RLS policies will be set via SQL in the schema
    console.log('ℹ️  RLS policies for storage will be set via SQL schema');

  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    console.log('ℹ️  You may need to create the storage bucket manually in Supabase dashboard');
  }
}

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    await seedCategories();
    await createStorageBucket();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify categories were created in Supabase dashboard');
    console.log('2. Check storage bucket exists and has public read access');
    console.log('3. Test the application by creating a recipe');

  } catch (error) {
    console.error('\n💥 Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
