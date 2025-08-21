export const BUCKET = 'public-media' as const;

export function sanitizeBase(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
}

export function buildAvatarKey(userId: string, base: string, ulid: string, ext: string) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `avatars/${userId}/${y}/${m}/${ulid}-${sanitizeBase(base)}.${ext}`;
}

export function buildRecipeOriginalKey(recipeId: string, base: string, ulid: string, ext: string) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `recipes/${recipeId}/originals/${y}/${m}/${ulid}-${sanitizeBase(base)}.${ext}`;
}

export function buildRecipeCoverKey(recipeId: string, ulid: string, ext: string) {
  return `recipes/${recipeId}/covers/${ulid}-cover.${ext}`;
}

export function buildCommentImageKey(recipeId: string, commentId: string, base: string, ulid: string, ext: string) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `recipes/${recipeId}/comments/${commentId}/${y}/${m}/${ulid}-${sanitizeBase(base)}.${ext}`;
}

// Generate a ULID-like unique identifier
export function generateULID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
}

// Get file extension from MIME type or filename
export function getFileExtension(filename: string, mimeType?: string): string {
  if (mimeType) {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeToExt[mimeType] || 'jpg';
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  return ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
}
