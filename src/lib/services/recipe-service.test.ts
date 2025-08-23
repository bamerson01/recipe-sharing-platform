import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeService } from './recipe-service';
import * as dbServer from '@/lib/db/server';

// Mock the getServerSupabase function
vi.mock('@/lib/db/server');

describe('RecipeService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    };

    // Mock the getServerSupabase to return our mock client
    vi.mocked(dbServer.getServerSupabase).mockResolvedValue(mockSupabase as any);
  });

  describe('fetchRecipes', () => {
    it('should fetch recipes with default parameters', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Test Recipe',
          slug: 'test-recipe',
          author: { id: '123', username: 'testuser' },
          categories: [],
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockRecipes,
        count: 1,
        error: null,
      });

      const result = await RecipeService.fetchRecipes({});

      expect(result.recipes).toEqual(mockRecipes);
      expect(result.totalCount).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
      expect(mockSupabase.select).toHaveBeenCalled();
    });

    it('should apply public filter when specified', async () => {
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      await RecipeService.fetchRecipes({ isPublic: true });

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_public', true);
    });

    it('should apply author filter when specified', async () => {
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      const authorId = 'user-123';
      await RecipeService.fetchRecipes({ authorId });

      expect(mockSupabase.eq).toHaveBeenCalledWith('author_id', authorId);
    });

    it('should apply search query when specified', async () => {
      mockSupabase.textSearch.mockReturnThis();
      mockSupabase.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      await RecipeService.fetchRecipes({ searchQuery: 'pasta' });

      expect(mockSupabase.textSearch).toHaveBeenCalledWith('search_vector', 'pasta');
    });

    it('should apply sorting correctly', async () => {
      mockSupabase.order.mockReturnThis();
      mockSupabase.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Test popular sorting
      await RecipeService.fetchRecipes({ sortBy: 'popular' });
      expect(mockSupabase.order).toHaveBeenCalledWith('like_count', { ascending: false });

      // Reset and test oldest sorting
      vi.clearAllMocks();
      mockSupabase.order.mockReturnThis();
      mockSupabase.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      await RecipeService.fetchRecipes({ sortBy: 'oldest' });
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Database error';
      mockSupabase.select.mockResolvedValue({
        data: null,
        count: null,
        error: { message: errorMessage },
      });

      await expect(RecipeService.fetchRecipes({})).rejects.toThrow(
        `Failed to fetch recipes: ${errorMessage}`
      );
    });

    it('should fetch user likes and saves when userId provided', async () => {
      const userId = 'user-123';
      const mockRecipes = [
        { id: 1, title: 'Recipe 1' },
        { id: 2, title: 'Recipe 2' },
      ];
      const mockLikes = [{ recipe_id: 1 }];
      const mockSaves = [{ recipe_id: 2 }];

      mockSupabase.select
        .mockResolvedValueOnce({
          data: mockRecipes,
          count: 2,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockLikes,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockSaves,
          error: null,
        });

      const result = await RecipeService.fetchRecipes({ userId });

      expect(result.recipes[0].isLiked).toBe(true);
      expect(result.recipes[0].isSaved).toBe(false);
      expect(result.recipes[1].isLiked).toBe(false);
      expect(result.recipes[1].isSaved).toBe(true);
    });
  });

  describe('fetchRecipeById', () => {
    it('should fetch a single recipe by ID', async () => {
      const mockRecipe = {
        id: 1,
        title: 'Test Recipe',
        categories: [{ category: { id: 1, name: 'Dessert' } }],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockRecipe,
        error: null,
      });

      const result = await RecipeService.fetchRecipeById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.categories).toEqual([{ id: 1, name: 'Dessert' }]);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should return null when recipe not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await RecipeService.fetchRecipeById(999);

      expect(result).toBeNull();
    });

    it('should fetch like and save status when userId provided', async () => {
      const mockRecipe = {
        id: 1,
        title: 'Test Recipe',
        categories: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockRecipe,
        error: null,
      });

      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // Like exists
        .mockResolvedValueOnce({ data: null, error: null }); // Save doesn't exist

      const result = await RecipeService.fetchRecipeById(1, 'user-123');

      expect(result?.isLiked).toBe(true);
      expect(result?.isSaved).toBe(false);
    });
  });

  describe('fetchFollowingFeed', () => {
    it('should return empty array when user follows nobody', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await RecipeService.fetchFollowingFeed('user-123');

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('follows');
    });

    it('should fetch recipes from followed users', async () => {
      const mockFollowing = [
        { following_id: 'user-456' },
        { following_id: 'user-789' },
      ];
      const mockRecipes = [
        {
          id: 1,
          title: 'Recipe from followed user',
          categories: [{ category: { id: 1, name: 'Breakfast' } }],
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({
          data: mockFollowing,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
        });

      const result = await RecipeService.fetchFollowingFeed('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Recipe from followed user');
      expect(mockSupabase.in).toHaveBeenCalledWith('author_id', ['user-456', 'user-789']);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('searchRecipes', () => {
    it('should search recipes with query', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Pasta Recipe',
          categories: [],
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockRecipes,
        error: null,
      });

      const result = await RecipeService.searchRecipes('pasta');

      expect(result).toHaveLength(1);
      expect(mockSupabase.textSearch).toHaveBeenCalledWith('search_vector', 'pasta');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_public', true);
    });

    it('should apply sort filter for popular recipes', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      await RecipeService.searchRecipes('', { sortBy: 'popular' });

      expect(mockSupabase.order).toHaveBeenCalledWith('like_count', { ascending: false });
    });

    it('should apply sort filter for recent recipes', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      await RecipeService.searchRecipes('', { sortBy: 'recent' });

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });
});