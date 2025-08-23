import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define validation schemas (these should be in a separate file in production)
export const RecipeSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title too long'),
  summary: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  isPublic: z.boolean().default(false),
  ingredients: z.array(z.string().min(1)).min(1, 'At least one ingredient required'),
  steps: z.array(z.string().min(1)).min(1, 'At least one step required'),
  categoryIds: z.array(z.number()).optional(),
});

export const UserProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
});

export const CommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment too long'),
  recipeId: z.number().positive(),
});

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  categories: z.string().optional(),
  sort: z.enum(['popular', 'recent']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

describe('Validation Schemas', () => {
  describe('RecipeSchema', () => {
    it('should validate a valid recipe', () => {
      const validRecipe = {
        title: 'Delicious Pasta',
        summary: 'A simple pasta recipe',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        isPublic: true,
        ingredients: ['Pasta', 'Tomato sauce', 'Cheese'],
        steps: ['Boil water', 'Cook pasta', 'Add sauce'],
        categoryIds: [1, 2],
      };

      const result = RecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });

    it('should reject recipe with short title', () => {
      const invalidRecipe = {
        title: 'A',
        ingredients: ['Test'],
        steps: ['Test'],
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 2 characters');
      }
    });

    it('should reject recipe without ingredients', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],
        steps: ['Test'],
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one ingredient required');
      }
    });

    it('should reject recipe without steps', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: ['Test'],
        steps: [],
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one step required');
      }
    });

    it('should reject invalid difficulty level', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        difficulty: 'very-hard',
        ingredients: ['Test'],
        steps: ['Test'],
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('should default isPublic to false', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: ['Test'],
        steps: ['Test'],
      };

      const result = RecipeSchema.parse(recipe);
      expect(result.isPublic).toBe(false);
    });
  });

  describe('UserProfileSchema', () => {
    it('should validate a valid profile', () => {
      const validProfile = {
        username: 'john_doe',
        displayName: 'John Doe',
        bio: 'I love cooking!',
      };

      const result = UserProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject short username', () => {
      const invalidProfile = {
        username: 'ab',
      };

      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Username must be at least 3 characters');
      }
    });

    it('should reject username with invalid characters', () => {
      const invalidProfile = {
        username: 'john@doe',
      };

      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username can only contain letters, numbers, hyphens, and underscores'
        );
      }
    });

    it('should reject bio that is too long', () => {
      const invalidProfile = {
        username: 'johndoe',
        bio: 'a'.repeat(501),
      };

      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields to be undefined', () => {
      const profile = {
        username: 'johndoe',
      };

      const result = UserProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe('CommentSchema', () => {
    it('should validate a valid comment', () => {
      const validComment = {
        content: 'This recipe is amazing!',
        recipeId: 1,
      };

      const result = CommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });

    it('should reject empty comment', () => {
      const invalidComment = {
        content: '',
        recipeId: 1,
      };

      const result = CommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Comment cannot be empty');
      }
    });

    it('should reject comment that is too long', () => {
      const invalidComment = {
        content: 'a'.repeat(501),
        recipeId: 1,
      };

      const result = CommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Comment too long');
      }
    });

    it('should reject invalid recipe ID', () => {
      const invalidComment = {
        content: 'Great recipe!',
        recipeId: -1,
      };

      const result = CommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });
  });

  describe('SearchQuerySchema', () => {
    it('should validate a valid search query', () => {
      const validQuery = {
        q: 'pasta',
        categories: '1,2,3',
        sort: 'popular',
        page: 2,
        limit: 30,
      };

      const result = SearchQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should provide defaults for page and limit', () => {
      const query = {};

      const result = SearchQuerySchema.parse(query);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid sort option', () => {
      const invalidQuery = {
        sort: 'invalid',
      };

      const result = SearchQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject page less than 1', () => {
      const invalidQuery = {
        page: 0,
      };

      const result = SearchQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const invalidQuery = {
        limit: 101,
      };

      const result = SearchQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should allow all optional fields to be undefined', () => {
      const query = {};

      const result = SearchQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });
});