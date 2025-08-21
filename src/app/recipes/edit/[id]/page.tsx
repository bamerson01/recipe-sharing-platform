"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RecipeInput, RecipeInputType } from "@/lib/validation/recipe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { ImageIcon, Plus, X, ChefHat, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { fetchRecipeById } from "../../_actions/fetch-recipes";
import { updateRecipe } from "../../_actions/manage-recipes";
import { fetchCategories, Category } from "../../_actions/categories";

type RecipeFormData = RecipeInputType;

interface Ingredient {
  id: number;
  text: string;
  position: number;
}

interface Step {
  id: number;
  text: string;
  position: number;
}

function EditRecipeForm({ recipeId }: { recipeId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(RecipeInput),
    defaultValues: {
      title: "",
      summary: "",
      isPublic: false,
      ingredients: [{ text: "", position: 0 }],
      steps: [{ text: "", position: 0 }],
      categoryIds: [],
    },
  });

  // Fetch recipe data and categories
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const recipeResult = await fetchRecipeById(parseInt(recipeId), user.id);
        if (recipeResult.ok) {
          const recipeData = recipeResult.recipe;
          setRecipe(recipeData);

          // Set form values
          form.setValue('title', recipeData.title);
          form.setValue('summary', recipeData.summary || '');
          form.setValue('isPublic', recipeData.is_public);
          form.setValue('ingredients', recipeData.ingredients);
          form.setValue('steps', recipeData.steps);
          form.setValue('categoryIds', recipeData.categories.map(c => c.id));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading recipe:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [user, recipeId, form]);

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      const result = await fetchCategories();
      if (result.ok) {
        setCategories(result.categories);
      }
    };
    loadCategories();
  }, []);

  const addIngredient = () => {
    const currentIngredients = form.getValues("ingredients") || [];
    const newIngredients = [
      ...currentIngredients,
      { text: "", position: currentIngredients.length }
    ];
    form.setValue("ingredients", newIngredients);
  };

  const removeIngredient = (index: number) => {
    const currentIngredients = form.getValues("ingredients") || [];
    if (currentIngredients.length > 1) {
      const newIngredients = currentIngredients.filter((_, i) => i !== index);
      form.setValue("ingredients", newIngredients);
    }
  };

  const addStep = () => {
    const currentSteps = form.getValues("steps") || [];
    const newSteps = [
      ...currentSteps,
      { text: "", position: currentSteps.length }
    ];
    form.setValue("steps", newSteps);
  };

  const removeStep = (index: number) => {
    const currentSteps = form.getValues("steps") || [];
    if (currentSteps.length > 1) {
      const newSteps = currentSteps.filter((_, i) => i !== index);
      form.setValue("steps", newSteps);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const currentCategories = form.getValues("categoryIds") || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    form.setValue("categoryIds", newCategories);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    document.getElementById('image-upload')?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: RecipeFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const validIngredients = data.ingredients.filter(ing => ing.text.trim());
      const validSteps = data.steps.filter(step => step.text.trim());

      if (validIngredients.length === 0) {
        setSubmitError("At least one ingredient is required");
        setIsSubmitting(false);
        return;
      }

      if (validSteps.length === 0) {
        setSubmitError("At least one step is required");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('id', recipeId);
      formData.append('title', data.title);
      formData.append('summary', data.summary || '');
      formData.append('isPublic', data.isPublic ? 'on' : 'off');
      formData.append('ingredients', JSON.stringify(validIngredients));
      formData.append('steps', JSON.stringify(validSteps));
      formData.append('categoryIds', JSON.stringify(data.categoryIds || []));

      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      const result = await updateRecipe(formData);

      if (result.ok) {
        router.push('/recipes/my?success=updated');
      } else {
        setSubmitError(result.message || 'Failed to update recipe');
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      setSubmitError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-destructive">Recipe not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Recipe</h1>
        <p className="text-muted-foreground">
          Update your culinary masterpiece
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update the essential details about your recipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Recipe Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Grandma's Chocolate Chip Cookies"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                placeholder="A brief description of your recipe..."
                {...form.register("summary")}
                rows={3}
              />
              {form.formState.errors.summary && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.summary.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPublic">Visibility</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  {...form.register("isPublic", { setValueAs: (value) => value === 'on' || value === true })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPublic" className="text-sm font-normal">
                  Make this recipe public (visible to everyone)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Select categories that best describe your recipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(form.watch("categoryIds") || []).length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={(form.watch("categoryIds") || []).includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
            <CardDescription>
              Update the photo for your recipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                onClick={triggerImageUpload}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-64 rounded-lg object-cover"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {imagePreview && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
            <CardDescription>
              List all the ingredients needed for your recipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(form.watch("ingredients") || []).map((ingredient, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-8">
                  {index + 1}.
                </span>
                <Input
                  placeholder="e.g., 2 cups all-purpose flour"
                  {...form.register(`ingredients.${index}.text`)}
                  className="flex-1"
                />
                {(form.watch("ingredients") || []).length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addIngredient}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              Provide step-by-step cooking instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(form.watch("steps") || []).map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground w-8 mt-2">
                  {index + 1}.
                </span>
                <Textarea
                  placeholder="e.g., Preheat oven to 350°F (175°C)"
                  {...form.register(`steps.${index}.text`)}
                  className="flex-1"
                  rows={2}
                />
                {(form.watch("steps") || []).length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="mt-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addStep}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Recipe...
              </>
            ) : (
              "Update Recipe"
            )}
          </Button>
        </div>

        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <EditRecipeForm recipeId={id} />
    </ProtectedRoute>
  );
}
