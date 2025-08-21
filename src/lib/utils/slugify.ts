/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug by appending a number if the slug already exists
 * @param text - The text to convert to a slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique URL-friendly slug
 */
export function generateUniqueSlug(text: string, existingSlugs: string[]): string {
  let slug = slugify(text);
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${slugify(text)}-${counter}`;
    counter++;
  }

  return slug;
}
