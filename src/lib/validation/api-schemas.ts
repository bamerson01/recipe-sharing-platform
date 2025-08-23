import { z } from 'zod';

// Profile Schemas
export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  bio: z.string().max(500, 'Bio too long').optional(),
});

// Recipe Schemas
export const CreateRecipeSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title too long'),
  summary: z.string().max(500).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  prep_time: z.number().min(0).optional(),
  cook_time: z.number().min(0).optional(),
  is_public: z.boolean().default(false),
  ingredients: z.array(z.union([
    z.string().min(1),
    z.object({
      text: z.string().min(1),
      position: z.number()
    })
  ])).min(1, 'At least one ingredient required'),
  steps: z.array(z.union([
    z.string().min(1),
    z.object({
      text: z.string().min(1),
      position: z.number()
    })
  ])).min(1, 'At least one step required'),
  category_ids: z.array(z.number()).optional(),
  cover_image_key: z.string().optional(),
});

export const UpdateRecipeSchema = CreateRecipeSchema.partial().extend({
  id: z.number(),
});

// Comment Schemas
export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment too long'),
});

// Search Schemas
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  categories: z.string().optional().transform(val => 
    val ? val.split(',').map(Number).filter(n => !isNaN(n)) : undefined
  ),
  sort: z.enum(['popular', 'recent']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Pagination Schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Follow Schemas
export const FollowUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Like/Save Schemas
export const ToggleLikeSchema = z.object({
  recipeId: z.coerce.number().positive(),
});

export const ToggleSaveSchema = z.object({
  recipeId: z.coerce.number().positive(),
});

// Avatar Upload Schema
export const AvatarUploadSchema = z.object({
  file: z.instanceof(File).refine(
    file => file.size <= 5 * 1024 * 1024, // 5MB
    'File size must be less than 5MB'
  ).refine(
    file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    'Only JPEG, PNG, and WebP images are allowed'
  ),
});

// Password Change Schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Username Schema
export const SetUsernameSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
});

// Helper function to validate request data
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

// Helper to format Zod errors for API responses
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  });
  
  return formatted;
}