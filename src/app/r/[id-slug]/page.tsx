import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LikeButton } from '@/components/like-button';
import { SaveButton } from '@/components/save-button';
import { ShareButton } from '@/components/share-button';
import { CommentsSection } from '@/components/comments/comments-section';
import { ChefHat, Clock } from 'lucide-react';
import Image from 'next/image';
import { imageSrcFromKey } from '@/lib/images/url';
import { getRecipeUrl, parseRecipeId, parseRecipeSlug, getProfileUrl } from '@/lib/urls';
import { getServerSupabase } from '@/lib/db/server';

interface RecipeDetailPageProps {
  params: Promise<{ 'id-slug': string }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const resolvedParams = await params;
  const idSlug = resolvedParams['id-slug'];

  // Parse ID from canonical URL format: /r/[id]-[slug]
  const recipeId = parseRecipeId(idSlug);
  if (!recipeId) {
    notFound();
  }

  const supabase = await getServerSupabase();

  // Get current user (optional)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch recipe
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      id,
      title,
      slug,
      summary,
      cover_image_key,
      is_public,
      like_count,
      created_at,
      updated_at,
      author_id,
      author:profiles!inner(
        id,
        display_name,
        username,
        avatar_key
      )
    `)
    .eq('id', recipeId)
    .single();

  if (error || !recipe) {
    notFound();
  }

  // Check if user can access this recipe
  if (!recipe.is_public && recipe.author_id !== user?.id) {
    notFound();
  }

  // Check if slug matches - if not, redirect to canonical URL
  const expectedSlug = parseRecipeSlug(idSlug);
  if (expectedSlug !== recipe.slug) {
    redirect(getRecipeUrl(recipe.id, recipe.title));
  }

  // Fetch additional data
  const [ingredientsRes, stepsRes, categoriesRes] = await Promise.all([
    supabase
      .from('recipe_ingredients')
      .select('id, position, text')
      .eq('recipe_id', recipe.id)
      .order('position'),
    supabase
      .from('recipe_steps')
      .select('id, position, text')
      .eq('recipe_id', recipe.id)
      .order('position'),
    supabase
      .from('recipe_categories')
      .select(`
        category_id,
        categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('recipe_id', recipe.id)
  ]);

  const ingredients = ingredientsRes.data || [];
  const steps = stepsRes.data || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = categoriesRes.data?.map((c: any) => c.categories) || [];
  
  // Author is returned as an array, get the first item
  const author = Array.isArray(recipe.author) ? recipe.author[0] : recipe.author;

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
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={author?.avatar_key
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${author.avatar_key}`
                      : undefined
                    }
                  />
                  <AvatarFallback className="text-xs">
                    {author?.display_name?.[0]?.toUpperCase() ||
                      author?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={getProfileUrl(author?.username || 'unknown')}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  {author?.display_name || author?.username || 'Anonymous'}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Save and Like Buttons */}
          <div className="flex items-center gap-2">
            <SaveButton
              recipeId={recipe.id}
              size="sm"
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            />
            <LikeButton
              recipeId={recipe.id}
              initialLikeCount={recipe.like_count}
              size="sm"
              variant="outline"
            />
            <ShareButton
              recipe={{
                id: recipe.id,
                title: recipe.title,
                summary: recipe.summary,
                cover_image_key: recipe.cover_image_key,
                author: {
                  username: author?.username || null,
                  display_name: author?.display_name || null
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                categories: categories.map((c: any) => ({ name: c.name }))
              }}
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {categories.map((category: any) => (
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
              src={imageSrcFromKey(recipe.cover_image_key, recipe.updated_at) || ''}
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {ingredients.map((ingredient: any, index: number) => (
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {steps.map((step: any, index: number) => (
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

      {/* Comments Section */}
      <CommentsSection 
        recipeId={recipe.id} 
        recipeAuthorId={recipe.author_id}
      />
    </div>
  );
}