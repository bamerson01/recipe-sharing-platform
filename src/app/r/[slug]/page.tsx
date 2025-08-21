import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchRecipeBySlug } from '@/app/recipes/_actions/fetch-recipes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, ChefHat, Clock, User } from 'lucide-react';
import Image from 'next/image';

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;

  const result = await fetchRecipeBySlug(slug);

  if (!result.ok) {
    notFound();
  }

  const { recipe } = result;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
            {recipe.summary && (
              <p className="text-lg text-muted-foreground mb-4">{recipe.summary}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <Link
                  href={`/u/${recipe.author.username || recipe.author.id}`}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  {recipe.author.display_name || 'Anonymous'}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Like Button */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              {recipe.like_count} likes
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Categories */}
        {recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Cover Image */}
      {recipe.cover_image_key && (
        <div className="mb-8">
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${recipe.cover_image_key}`}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Ingredients */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={ingredient.id} className="flex items-start gap-3">
                <span className="text-sm font-medium text-muted-foreground w-6 mt-1">
                  {index + 1}.
                </span>
                <span className="flex-1">{ingredient.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={step.id} className="flex items-start gap-3">
                <span className="text-sm font-medium text-muted-foreground w-6 mt-1">
                  {index + 1}.
                </span>
                <p className="flex-1">{step.text}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
