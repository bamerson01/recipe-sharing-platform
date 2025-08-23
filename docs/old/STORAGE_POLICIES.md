new public-media bucket and lock in a folder/key scheme that’s simple today and scales to multi-image recipes and user-submitted photos later.

1) Bucket + baseline policies (Supabase SQL)
-- 1) Create bucket (world-readable)
select storage.create_bucket('public-media', public => true);

-- 2) Allow public read (only this bucket)
create policy "public read public-media"
on storage.objects for select
using (bucket_id = 'public-media');

-- 3) (Recommended) Block client writes; we’ll write via server routes using the service key.
-- If you want client-side uploads later, we can add fine-grained RLS by prefix.
revoke insert on storage.objects from anon, authenticated;
revoke update on storage.objects from anon, authenticated;
revoke delete on storage.objects from anon, authenticated;


Rationale: keep reads public, do all writes/deletes via your Next.js API with the service role. That keeps auth/ownership logic in your app (simple now, safe later).

2) Directory layout (inside public-media)

Use stable, future-friendly prefixes and isolate by entity IDs.

public-media
├─ avatars/
│  └─ <userId>/
│     └─ <yyyy>/<mm>/<ulid>-<safeBaseName>.<ext>
│
├─ recipes/
│  └─ <recipeId>/
│     ├─ originals/
│     │  └─ <yyyy>/<mm>/<ulid>-<safeBaseName>.<ext>
│     ├─ covers/           # optional: single “main” image slot
│     │  └─ <ulid>-cover.<ext>
│     └─ comments/
│        └─ <commentId>/
│           └─ <yyyy>/<mm>/<ulid>-<safeBaseName>.<ext>


Why this works

Clear separation: avatars, recipes, comments.

Per-entity subfolders prevent collisions and make GC/migrations easy.

Date partitions keep large folders fast in dashboards.

originals/ vs covers/ leaves room for future variants/ (thumbnails, webp, etc.) without reshuffling.

3) Key patterns

avatars/<userId>/<yyyy>/<mm>/<ulid>-<safe>.<ext>

recipes/<recipeId>/covers/<ulid>-cover.<ext>

recipes/<recipeId>/originals/<yyyy>/<mm>/<ulid>-<safe>.<ext>

recipes/<recipeId>/comments/<commentId>/<yyyy>/<mm>/<ulid>-<safe>.<ext>

Rules

ulid (or uuid v7) for uniqueness + sort-by-time.

safeBaseName = lowercase, spaces→-, strip non [a-z0-9-_.], collapse -.

Always preserve the real extension from MIME sniff.

4) Minimal DB fields (simple now, scalable later)

profiles.avatar_key text — e.g., avatars/<userId>/2025/08/01F...-portrait.jpg

recipes.cover_image_key text — single “main” image

recipe_images (for additional gallery images, future-proof)

id uuid pk default gen_random_uuid()

recipe_id uuid fk → recipes(id)

key text not null

uploaded_by uuid fk → profiles(id)

created_at timestamptz default now()

recipe_comments

id uuid pk

recipe_id uuid

user_id uuid

body text

created_at timestamptz default now()

recipe_comment_images (future, if/when you allow images on comments)

id uuid pk

comment_id uuid fk → recipe_comments(id)

key text not null

uploaded_by uuid

created_at timestamptz default now()

We store keys (not URLs). URLs are derived at render-time. This keeps you CDN-/domain-agnostic.

5) API surface (server routes do the writes)

POST /api/users/me/avatar → returns { bucket: 'public-media', key, url }

DELETE /api/users/me/avatar

POST /api/recipes/:id/images (gallery/originals)

DELETE /api/recipes/:id/images/:imageId

POST /api/recipes/:id/cover

POST /api/recipes/:id/comments/:commentId/images (later)

Behavior

Validate auth + ownership on server.

Build the key using helpers (below).

Upload with service role to public-media.

Return the key (and a public URL for convenience).

6) Tiny helpers you can drop in (lib/storage.ts)

(TypeScript signatures—keep all URL building in one place.)

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


For URLs: supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl
Cache-bust avatars by appending ?v=${avatar_updated_at?.getTime()}.