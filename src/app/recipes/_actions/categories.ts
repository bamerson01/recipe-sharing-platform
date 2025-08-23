'use server';

import { getServerSupabase } from '@/lib/db/server';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export async function fetchCategories() {
  try {
    const supabase = await getServerSupabase();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (error) {      return { ok: false, message: 'Failed to fetch categories' } as const;
    }

    return { ok: true, categories: categories || [] } as const;

  } catch (error) {    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}

export async function seedCategories() {
  try {
    const supabase = await getServerSupabase();

    // Check if categories already exist
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (existingCategories && existingCategories.length > 0) {
      return { ok: true, message: 'Categories already seeded' } as const;
    }

    // Seed default categories
    const defaultCategories = [
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
      .insert(defaultCategories);

    if (error) {      return { ok: false, message: 'Failed to seed categories' } as const;
    }

    return { ok: true, message: 'Categories seeded successfully' } as const;

  } catch (error) {    return { ok: false, message: 'An unexpected error occurred' } as const;
  }
}
