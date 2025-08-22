"use client";

import { useState } from "react";
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
import { ImageIcon, Plus, X, ChefHat, Loader2 } from "lucide-react";
import { updateRecipe } from "../../_actions/manage-recipes";
import { imageSrcFromKey } from "@/lib/images/url";

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

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface RecipeWithDetails {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_key: string | null;
  is_public: boolean;
  author_id: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  prep_time: number | null;
  cook_time: number | null;
  created_at: string;
  updated_at: string;
  ingredients: Ingredient[];
  steps: Step[];
  categories: Category[];
}

interface EditRecipeFormProps {
  recipe: RecipeWithDetails;
  categories: Category[];
}

export function EditRecipeForm({ recipe, categories }: EditRecipeFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(RecipeInput),
    defaultValues: {
      title: recipe.title,
      summary: recipe.summary || "",
      isPublic: recipe.is_public,
      difficulty: recipe.difficulty,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [{ text: "", position: 0 }],
      steps: recipe.steps.length > 0 ? recipe.steps : [{ text: "", position: 0 }],
      categoryIds: recipe.categories.map(c => c.id),
    },
  });

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
      formData.append('id', recipe.id.toString());
      formData.append('title', data.title);
      formData.append('summary', data.summary || '');
      formData.append('isPublic', data.isPublic ? 'on' : 'off');
      formData.append('difficulty', data.difficulty || '');
      formData.append('prepTime', data.prepTime?.toString() || '');
      formData.append('cookTime', data.cookTime?.toString() || '');
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

  return (
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                {...form.register("difficulty")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep Time (minutes)</Label>
              <Input
                id="prepTime"
                type="number"
                min="0"
                placeholder="e.g., 15"
                {...form.register("prepTime", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTime">Cook Time (minutes)</Label>
              <Input
                id="cookTime"
                type="number"
                min="0"
                placeholder="e.g., 30"
                {...form.register("cookTime", { valueAsNumber: true })}
              />
            </div>
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
                tabIndex={-1}
                autoFocus={false}
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
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
              ) : recipe.cover_image_key ? (
                <div className="space-y-4">
                  <img
                    src={imageSrcFromKey(recipe.cover_image_key, recipe.updated_at) || ''}
                    alt="Current cover"
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
  );
}
