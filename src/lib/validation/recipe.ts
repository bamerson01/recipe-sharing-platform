import { z } from 'zod';

export const RecipeInput = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  summary: z.string().optional(),
  isPublic: z.boolean().default(false),
  ingredients: z.array(z.object({
    text: z.string().min(1, 'Ingredient text is required'),
    position: z.number().int().min(0),
  })).min(1, 'At least one ingredient is required'),
  steps: z.array(z.object({
    text: z.string().min(1, 'Step text is required'),
    position: z.number().int().min(0),
  })).min(1, 'At least one step is required'),
  categoryIds: z.array(z.number()).optional(),
});

export const RecipeUpdateInput = RecipeInput.partial().extend({
  id: z.number(),
});

export type RecipeInputType = z.infer<typeof RecipeInput>;
export type RecipeUpdateInputType = z.infer<typeof RecipeUpdateInput>;
