"use client";

import { RecipeCard } from "@/components/recipe-card";

// Mock data for now - will be replaced with real API calls
const mockRecipes = [
  {
    slug: "classic-chocolate-chip-cookies",
    title: "Classic Chocolate Chip Cookies",
    summary: "The perfect chocolate chip cookie - crispy on the outside, chewy on the inside.",
    imagePath: "/api/placeholder/400/300",
    likeCount: 127,
    authorName: "Sarah Baker",
    categories: [
      { name: "Dessert", slug: "dessert" },
      { name: "Quick", slug: "quick" }
    ],
    isLiked: false,
  },
  {
    slug: "vegan-buddha-bowl",
    title: "Vegan Buddha Bowl",
    summary: "A colorful and nutritious bowl packed with quinoa, roasted vegetables, and tahini dressing.",
    imagePath: "/api/placeholder/400/300",
    likeCount: 89,
    authorName: "Mike Chen",
    categories: [
      { name: "Vegan", slug: "vegan" },
      { name: "Lunch", slug: "lunch" }
    ],
    isLiked: true,
  },
  {
    slug: "one-pot-chicken-pasta",
    title: "One-Pot Chicken Pasta",
    summary: "A simple and delicious pasta dish that cooks in one pot for easy cleanup.",
    imagePath: "/api/placeholder/400/300",
    likeCount: 156,
    authorName: "Emma Wilson",
    categories: [
      { name: "Dinner", slug: "dinner" },
      { name: "One-Pot", slug: "one-pot" }
    ],
    isLiked: false,
  },
  {
    slug: "blueberry-pancakes",
    title: "Fluffy Blueberry Pancakes",
    summary: "Light and fluffy pancakes bursting with fresh blueberries and maple syrup.",
    imagePath: "/api/placeholder/400/300",
    likeCount: 203,
    authorName: "David Johnson",
    categories: [
      { name: "Breakfast", slug: "breakfast" },
      { name: "Quick", slug: "quick" }
    ],
    isLiked: false,
  },
  {
    slug: "slow-cooker-beef-stew",
    title: "Slow Cooker Beef Stew",
    summary: "Tender beef stew with vegetables that cooks all day for maximum flavor.",
    imagePath: "/api/placeholder/400/300",
    likeCount: 94,
    authorName: "Lisa Rodriguez",
    categories: [
      { name: "Dinner", slug: "dinner" },
      { name: "Slow Cooker", slug: "slow-cooker" }
    ],
    isLiked: false,
  },
  {
    slug: "chocolate-avocado-mousse",
    title: "Chocolate Avocado Mousse",
    summary: "Rich and creamy chocolate mousse made with avocado for a healthy twist.",
    imagePath: "/api/placeholder/400/300",
    likeCount: 67,
    authorName: "Alex Thompson",
    categories: [
      { name: "Dessert", slug: "dessert" },
      { name: "Vegan", slug: "vegan" }
    ],
    isLiked: false,
  },
];

export function RecipeGrid() {
  const handleLikeToggle = (recipeSlug: string) => {
    // TODO: Implement like toggle functionality
    console.log(`Toggle like for recipe ${recipeSlug}`);
  };

  if (mockRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No recipes found. Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {mockRecipes.map((recipe) => (
        <RecipeCard
          key={recipe.slug}
          {...recipe}
          onLikeToggle={() => handleLikeToggle(recipe.slug)}
        />
      ))}
    </div>
  );
}
