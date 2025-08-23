// Base64 encoded 1x1 pixel transparent image as fallback
const DEFAULT_BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

// Shimmer effect placeholder
const SHIMMER_BLUR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiNlYmViZWIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+";

// Warm culinary-themed blur placeholder
const RECIPE_BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEFEhMjUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSBUaWMkOhx8LoGsyvCJOvpOcHF5ve3ePpnM+8L4lzrpXhr8ZURT5r8y4XA3W8jtPpFyZaMc265OtqwTJlXp5L+EkLDfkLU9mCx5VM92k9wVpbEXNvdM8kVRokM7lRRXUsVh5C7t0pVK2Fqg9C70qSvVDNgyNg7v6Uqj3RXNPEFJGdGOV9wR8Vj9p2kzWQwuYvqwzbFuEBJnOu6h/V2D0NvJ5lxY4k+YkBRpJQo0K9YJSLYVJgKUEXdW9qcuK8VYgDTZFRF8p5x9rNZoiIhiKqgx2FaBvQDT6D7HFb9EXDFRT9LpAo="

/**
 * Get a blur placeholder for recipe images
 * @param type - Type of placeholder: 'default' | 'shimmer' | 'recipe'
 */
export function getBlurPlaceholder(type: 'default' | 'shimmer' | 'recipe' = 'recipe'): string {
  switch (type) {
    case 'shimmer':
      return SHIMMER_BLUR;
    case 'recipe':
      return RECIPE_BLUR;
    default:
      return DEFAULT_BLUR;
  }
}

/**
 * Get responsive sizes for recipe images based on their display context
 * @param context - Where the image is displayed
 */
export function getImageSizes(context: 'card' | 'modal' | 'hero' | 'thumbnail' = 'card'): string {
  switch (context) {
    case 'hero':
      return '100vw';
    case 'modal':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px';
    case 'thumbnail':
      return '(max-width: 640px) 100px, 150px';
    case 'card':
    default:
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
}

/**
 * Determine if an image should have priority loading
 * @param index - Index of the image in a list
 * @param threshold - Number of images to prioritize
 */
export function shouldPrioritizeImage(index: number, threshold: number = 3): boolean {
  return index < threshold;
}