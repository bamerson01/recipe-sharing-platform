"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecipeInput } from "@/lib/validation/recipe";

type RecipeFormData = z.infer<typeof RecipeInput>;

interface Ingredient {
  id: string;
  text: string;
  position: number;
}

interface Step {
  id: string;
  text: string;
  position: number;
}

function NewRecipeForm() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", text: "", position: 0 }
  ]);
  const [steps, setSteps] = useState<Step[]>([
    { id: "1", text: "", position: 0 }
  ]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RecipeFormData>({
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

  // Mock categories - will be fetched from API
  const categories = [
    { id: 1, name: "Breakfast", slug: "breakfast" },
    { id: 2, name: "Lunch", slug: "lunch" },
    { id: 3, name: "Dinner", slug: "dinner" },
    { id: 4, name: "Dessert", slug: "dessert" },
    { id: 5, name: "Vegan", slug: "vegan" },
    { id: 6, name: "Quick", slug: "quick" },
  ];

  const addIngredient = () => {
    const newId = (ingredients.length + 1).toString();
    setIngredients([...ingredients, { id: newId, text: "", position: ingredients.length }]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      const filtered = ingredients.filter(ing => ing.id !== id);
      const reordered = filtered.map((ing, index) => ({ ...ing, position: index }));
      setIngredients(reordered);
    }
  };

  const updateIngredient = (id: string, text: string) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id ? { ...ing, text } : ing
    ));
  };

  const addStep = () => {
    const newId = (steps.length + 1).toString();
    setSteps([...steps, { id: newId, text: "", position: steps.length }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      const filtered = steps.filter(step => step.id !== id);
      const reordered = filtered.map((step, index) => ({ ...step, position: index }));
      setSteps(reordered);
    }
  };

  const updateStep = (id: string, text: string) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, text } : step
    ));
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true);

    // Prepare form data
    const formData = {
      ...data,
      ingredients: ingredients.filter(ing => ing.text.trim()),
      steps: steps.filter(step => step.text.trim()),
      categoryIds: selectedCategories,
    };

    try {
      // TODO: Implement recipe creation API call
      console.log("Creating recipe:", formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Redirect to recipe detail page or show success message
      console.log("Recipe created successfully!");

    } catch (error) {
      console.error("Error creating recipe:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Recipe</h1>
          <p className="text-muted-foreground">
            Share your culinary creation with the RecipeNest community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Start with the essential details about your recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Classic Chocolate Chip Cookies"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="A brief description of your recipe..."
                  rows={3}
                  {...register("summary")}
                />
                {errors.summary && (
                  <p className="text-sm text-destructive">{errors.summary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    {...register("isPublic")}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isPublic">Make this recipe public</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Public recipes can be discovered by other users. Private recipes are only visible to you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
              <CardDescription>
                Add a beautiful image to showcase your recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Recipe preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <Label htmlFor="image" className="cursor-pointer">
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Click to upload image</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </Label>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
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
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder="e.g., 2 cups all-purpose flour"
                    value={ingredient.text}
                    onChange={(e) => updateIngredient(ingredient.id, e.target.value)}
                    className="flex-1"
                  />
                  {ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(ingredient.id)}
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
                Provide step-by-step instructions for cooking your recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-muted-foreground w-8 mt-2">
                    {index + 1}.
                  </span>
                  <Textarea
                    placeholder="Describe this step..."
                    value={step.text}
                    onChange={(e) => updateStep(step.id, e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStep(step.id)}
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
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Recipe...
                </>
              ) : (
                <>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Create Recipe
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRecipePage() {
  return (
    <ProtectedRoute>
      <NewRecipeForm />
    </ProtectedRoute>
  );
}
