import { BUCKET } from './storage';

// Helper to get public URL from storage key
export function getStorageUrl(storageKey: string | null): string | null {
  if (!storageKey) return null;

  // If it's already a full URL, return as is
  if (storageKey.startsWith('http')) {
    return storageKey;
  }

  // For local development, construct the URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storageKey}`;
  }

  return null;
}

// Helper to get avatar URL (with fallback for old avatar_url field)
export function getAvatarUrl(avatarKey: string | null, avatarUrl?: string | null): string | null {
  // Try new avatar_key first
  if (avatarKey) {
    return getStorageUrl(avatarKey);
  }

  // Fallback to old avatar_url if it exists
  if (avatarUrl) {
    return avatarUrl;
  }

  return null;
}

// Helper to get recipe cover image URL (with fallback for old image_path field)
export function getRecipeCoverUrl(coverImageKey: string | null, imagePath?: string | null): string | null {
  // Try new cover_image_key first
  if (coverImageKey) {
    return getStorageUrl(coverImageKey);
  }

  // Fallback to old image_path if it exists
  if (imagePath) {
    return imagePath;
  }

  return null;
}

// Helper to check if a URL is from the old recipe-images bucket
export function isOldBucketUrl(url: string | null): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/recipe-images/');
}

// Helper to migrate old URLs to new keys (for display purposes)
export function migrateOldUrlToKey(url: string | null): string | null {
  if (!url || !isOldBucketUrl(url)) return null;

  // Extract the path after the bucket name
  const urlParts = url.split('/storage/v1/object/public/recipe-images/');
  if (urlParts.length > 1) {
    return urlParts[1];
  }

  return null;
}
