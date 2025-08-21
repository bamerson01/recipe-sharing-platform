-- Seed categories for RecipeNest
INSERT INTO public.categories (name, slug) VALUES
  ('Breakfast', 'breakfast'),
  ('Lunch', 'lunch'),
  ('Dinner', 'dinner'),
  ('Dessert', 'dessert'),
  ('Snacks', 'snacks'),
  ('Vegan', 'vegan'),
  ('Vegetarian', 'vegetarian'),
  ('Gluten-Free', 'gluten-free'),
  ('Keto', 'keto'),
  ('Paleo', 'paleo'),
  ('Quick', 'quick'),
  ('Slow Cooker', 'slow-cooker'),
  ('One-Pot', 'one-pot'),
  ('Air Fryer', 'air-fryer')
ON CONFLICT (slug) DO NOTHING;
