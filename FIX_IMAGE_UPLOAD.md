# Recipe Image Upload Fix

## Problem
Images are not being saved when creating or editing recipes. The issue was that the File object from FormData wasn't being properly validated and processed in the server actions.

## Root Causes

1. **Zod Validation Issue**: `z.instanceof(File)` doesn't work in server actions because File objects get serialized when sent from client to server.
2. **File Type Check**: The imageFile from FormData needs explicit type checking before processing.
3. **Storage Policies**: Storage bucket permissions may not be properly configured.

## Fixes Applied

### 1. Server Action Validation (COMPLETED)

**Files Modified:**
- `/src/app/recipes/_actions/create-recipe.ts`
- `/src/app/recipes/_actions/manage-recipes.ts`

**Changes:**
```typescript
// Before
const CreateRecipeInput = RecipeInput.extend({
  imageFile: z.instanceof(File).nullable().optional(),
});

// After
const CreateRecipeInput = RecipeInput.extend({
  imageFile: z.any().optional(), // File validation doesn't work in server actions
});

// Added explicit File check
const imageFile = formData.get('imageFile');
const rawData = {
  // ... other fields
  imageFile: imageFile instanceof File ? imageFile : null,
};

// In upload logic
if (parsed.data.imageFile && parsed.data.imageFile instanceof File) {
  // Process upload
}
```

### 2. Enhanced Logging (COMPLETED)

Added detailed logging to track:
- FormData contents
- File object validation
- Upload process
- Storage key generation
- Success/failure states

### 3. Database Storage Policies (TO BE APPLIED)

**File Created:** `/database/storage_policies.sql`

This SQL script needs to be run in your Supabase SQL editor to:
- Ensure public-media bucket exists with correct settings
- Set up proper RLS policies for image uploads
- Allow authenticated users to upload to their folders
- Allow public viewing of all images

## How to Apply the Complete Fix

1. **The code fixes are already applied** - Server actions now properly handle File objects.

2. **Apply storage policies in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and run the contents of `/database/storage_policies.sql`
   - This will set up proper storage permissions

3. **Test the fix:**
   - Create a new recipe with an image
   - Check browser console for detailed logs
   - Verify image appears in recipe card and detail modal
   - Edit the recipe and verify image persists

## Testing Scripts

Several testing scripts have been created:

1. **Check existing images:** `npx tsx src/scripts/check-recipe-images.ts`
   - Shows all recipes with images
   - Verifies if images exist in storage
   - Provides statistics

2. **Test storage setup:** `npm run test:storage`
   - Verifies bucket configuration
   - Tests folder structure
   - Checks permissions

3. **Test image upload:** `npx tsx src/scripts/test-image-upload.ts`
   - Tests bucket existence
   - Attempts test upload
   - Lists storage contents

## Debugging Tips

If images still don't upload:

1. **Check browser console** for detailed logs showing:
   - File object details
   - Upload process
   - Any errors

2. **Check Supabase logs** in dashboard for storage errors

3. **Verify bucket settings** in Supabase Storage tab:
   - Bucket should be public
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/avif

4. **Test with the scripts** to isolate issues:
   ```bash
   # Check current state
   npx tsx src/scripts/check-recipe-images.ts
   
   # Test storage
   npm run test:storage
   ```

## Expected Behavior After Fix

1. When creating a recipe with an image:
   - Image uploads to `public-media/recipes/{user-id}/covers/`
   - Path is saved in `recipes.cover_image_key`
   - Image displays in recipe cards and modals

2. When editing a recipe:
   - Existing image shows in edit form
   - Uploading new image replaces old one
   - Old image is deleted from storage

3. Image URLs are generated with cache-busting:
   - Uses `updated_at` timestamp for versioning
   - Format: `{storage-url}?v={timestamp}`