import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChefHat, Heart, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center mb-6">
            <ChefHat className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Share Your Recipes,
            <br />
            <span className="text-primary">Discover New Favorites</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, organize, and share your favorite recipes with a beautiful, simple interface.
            Join a community of food lovers discovering new dishes every day.
          </p>

          {/* Search Input */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search recipes..."
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8">
                Get Started - It&apos;s Free
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg" className="h-12 px-8">
                Browse Recipes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16">
            Why Choose RecipeNest?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Simple Recipe Editor</h3>
              <p className="text-muted-foreground">
                Create recipes with our intuitive editor. Add ingredients, steps, and images in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Social Sharing</h3>
              <p className="text-muted-foreground">
                Share your creations and discover what others are cooking. Like and save your favorites.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Driven</h3>
              <p className="text-muted-foreground">
                Join a community of food enthusiasts. Get inspired by recipes from around the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-16">
            Join Thousands of Food Lovers
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Recipes Shared</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Likes Given</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Sharing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join RecipeNest today and become part of our growing community of food enthusiasts.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="h-12 px-8">
              Create Your First Recipe
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
