import { z } from 'zod';

// Reserved usernames that cannot be used
export const RESERVED_USERNAMES = new Set([
  // System routes
  'admin',
  'api',
  'app',
  'auth',
  'dashboard',
  'help',
  'support',
  'system',
  
  // App routes
  'explore',
  'saved',
  'my',
  'settings',
  'onboarding',
  'profile',
  'recipes',
  'recipe',
  'search',
  'categories',
  'category',
  
  // Short routes
  'u', // user profiles
  'r', // recipe pages
  'c', // categories
  
  // Common reserved words
  'about',
  'blog',
  'contact',
  'faq',
  'home',
  'legal',
  'login',
  'logout',
  'new',
  'null',
  'privacy',
  'register',
  'signin',
  'signout',
  'signup',
  'terms',
  'undefined',
  'www',
  
  // Social/brand protection
  'recipenest',
  'official',
  'verified',
  'moderator',
  'mod',
  'staff',
]);

// Username validation schema
export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-z0-9_]+$/,
    'Username can only contain lowercase letters, numbers, and underscores'
  )
  .transform(val => val.toLowerCase())
  .refine(
    val => !RESERVED_USERNAMES.has(val),
    'This username is reserved and cannot be used'
  );

// Form schema for username selection
export const UsernameFormSchema = z.object({
  username: UsernameSchema,
});

export type UsernameFormData = z.infer<typeof UsernameFormSchema>;

// Helper to check if username is valid format (without checking availability)
export function isValidUsernameFormat(username: string): boolean {
  try {
    UsernameSchema.parse(username);
    return true;
  } catch {
    return false;
  }
}

// Helper to get error message for invalid username
export function getUsernameError(username: string): string | null {
  try {
    UsernameSchema.parse(username);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Invalid username';
    }
    return 'Invalid username';
  }
}