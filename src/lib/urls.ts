// Canonical URL helpers

import { slug as generateSlug } from 'github-slugger';

/**
 * Generate canonical recipe URL
 * Format: /r/[id]-[slug]
 */
export function getRecipeUrl(id: number, title: string): string {
  const slug = generateSlug(title);
  return `/r/${id}-${slug}`;
}

/**
 * Generate canonical profile URL
 * Format: /u/[username]
 */
export function getProfileUrl(username: string | null): string {
  if (!username) return '#';
  return `/u/${username}`;
}

/**
 * Parse recipe ID from canonical URL
 * Extracts ID from /r/123-recipe-title format
 */
export function parseRecipeId(idSlug: string): number | null {
  const match = idSlug.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse recipe slug from canonical URL
 * Extracts slug from /r/123-recipe-title format
 */
export function parseRecipeSlug(idSlug: string): string | null {
  const match = idSlug.match(/^\d+-(.+)$/);
  return match ? match[1] : null;
}

/**
 * Generate slug from title
 * Consistent slug generation across the app
 */
export function createSlug(title: string): string {
  return generateSlug(title);
}