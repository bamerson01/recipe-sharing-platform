# Storage Policies & File Management

## Overview

The RecipeNest platform uses Supabase Storage for secure, scalable file management. This document outlines the storage bucket configurations, upload policies, file organization, and security measures implemented across the platform.

## Storage Architecture

### Bucket Organization
The platform uses three main storage buckets, each with specific purposes and access patterns:

1. **`avatars`** - User profile pictures
2. **`public-media`** - Recipe cover images and public content
3. **`temp-uploads`** - Temporary file storage during uploads

### Storage Provider
- **Service**: Supabase Storage (built on PostgreSQL and S3-compatible storage)
- **Region**: Global distribution with edge caching
- **Security**: Row Level Security (RLS) policies for access control
- **Performance**: CDN integration for fast global delivery

## Bucket Configurations

### Avatars Bucket

#### Purpose
Stores user profile pictures with secure access control and automatic optimization.

#### Configuration
```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

#### Access Control
- **Public Read**: ✅ Yes (profile pictures are publicly visible)
- **Authenticated Upload**: ✅ Yes (users can upload their own avatars)
- **File Size Limit**: 5 MB
- **Allowed Formats**: JPG, PNG, WebP
- **Image Optimization**: Automatic resizing and compression

#### File Organization
```
avatars/
├── {user_id}/
│   ├── 2025/
│   │   ├── {timestamp}-{filename}.jpg
│   │   └── {timestamp}-{filename}.webp
│   └── current/
│       └── {filename}.jpg
```

#### Business Rules
- Users can only upload to their own avatar directory
- Automatic cleanup of old avatar versions
- Fallback to default avatar if none uploaded
- Optimized delivery for different device sizes

### Public Media Bucket

#### Purpose
Stores recipe cover images and other public content with optimized delivery.

#### Configuration
```sql
-- Create public-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-media', 'public-media', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

#### Access Control
- **Public Read**: ✅ Yes (recipe images are publicly visible)
- **Authenticated Upload**: ✅ Yes (recipe authors can upload covers)
- **File Size Limit**: 10 MB
- **Allowed Formats**: JPG, PNG, WebP
- **Image Optimization**: Automatic resizing and format conversion

#### File Organization
```
public-media/
├── recipes/
│   ├── {recipe_id}/
│   │   ├── covers/
│   │   │   ├── {timestamp}-{filename}.jpg
│   │   │   └── {timestamp}-{filename}.webp
│   │   └── thumbnails/
│   │       ├── {size}-{filename}.jpg
│   │       └── {size}-{filename}.webp
│   └── shared/
│       └── {category}/
│           └── {filename}.jpg
```

#### Business Rules
- Recipe authors can upload cover images for their recipes
- Automatic thumbnail generation for different display sizes
- Public access for recipe discovery and sharing
- Optimized delivery with responsive image sizing

### Temp Uploads Bucket

#### Purpose
Temporary storage for files during the upload process before final processing.

#### Configuration
```sql
-- Create temp-uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-uploads', 'temp-uploads', false);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

#### Access Control
- **Public Read**: ❌ No (temporary files are private)
- **Authenticated Upload**: ✅ Yes (users can upload temporary files)
- **File Size Limit**: 25 MB
- **Allowed Formats**: Any (validated during processing)
- **Auto-cleanup**: Files automatically deleted after 24 hours

#### File Organization
```
temp-uploads/
├── {user_id}/
│   ├── {session_id}/
│   │   ├── {timestamp}-{filename}.tmp
│   │   └── metadata.json
│   └── processing/
│       └── {job_id}/
│           └── {filename}.tmp
```

#### Business Rules
- Temporary storage for upload processing
- Automatic cleanup to prevent storage bloat
- Session-based organization for multi-step uploads
- Metadata tracking for upload progress

## Upload Policies & Security

### Authentication Requirements

#### User Avatar Uploads
```sql
-- Policy: Users can upload avatars to their own directory
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Security Features**:
- **User isolation**: Users can only upload to their own avatar directory
- **Path validation**: Enforces directory structure based on user ID
- **Authentication required**: Only authenticated users can upload
- **File type validation**: Server-side validation of image formats

#### Recipe Cover Uploads
```sql
-- Policy: Recipe authors can upload cover images
CREATE POLICY "Recipe authors can upload covers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'public-media' AND
  auth.uid() IN (
    SELECT author_id FROM recipes 
    WHERE id = (storage.foldername(name))[2]::bigint
  )
);
```

**Security Features**:
- **Ownership verification**: Only recipe authors can upload covers
- **Recipe validation**: Ensures recipe exists and user owns it
- **Public access**: Uploaded images are publicly readable
- **Size limits**: Enforced at both client and server levels

### File Validation

#### Client-Side Validation
```typescript
// File validation before upload
const validateFile = (file: File): ValidationResult => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  return { valid: true };
};
```

#### Server-Side Validation
```typescript
// Server-side file validation
const validateUploadedFile = async (file: Buffer, metadata: FileMetadata) => {
  // Check file size
  if (file.length > MAX_FILE_SIZE) {
    throw new Error('File exceeds size limit');
  }
  
  // Validate file type using magic bytes
  const fileType = await FileType.fromBuffer(file);
  if (!ALLOWED_MIME_TYPES.includes(fileType?.mime || '')) {
    throw new Error('Invalid file type');
  }
  
  // Check for malicious content
  if (await containsMaliciousContent(file)) {
    throw new Error('File contains malicious content');
  }
  
  return true;
};
```

### Security Measures

#### Malware Protection
- **Virus scanning**: Automatic scanning of uploaded files
- **File type validation**: Strict MIME type checking
- **Content analysis**: Detection of potentially harmful content
- **Quarantine system**: Suspicious files are isolated for review

#### Access Control
- **Row Level Security**: Database-level access control
- **User isolation**: Users can only access their own files
- **Public/private buckets**: Appropriate visibility for different content types
- **Rate limiting**: Prevents abuse and DoS attacks

#### Data Protection
- **Encryption at rest**: Files are encrypted in storage
- **Secure transmission**: HTTPS for all file transfers
- **Access logging**: Comprehensive audit trail of file access
- **Backup protection**: Secure backup and recovery procedures

## File Naming Conventions

### Avatar Files
```
{user_id}/{year}/{timestamp}-{original_name}.{extension}
```

**Examples**:
- `e1e70937-7dcb-425f-94e2-37365a579ca8/2025/20250122-143022-profile.jpg`
- `b8511926-35f9-4619-97ac-3616e6ccae5c/2025/20250122-143156-avatar.webp`

**Benefits**:
- **Unique identification**: Timestamp prevents filename conflicts
- **Chronological organization**: Easy to find recent uploads
- **User isolation**: Clear separation between users
- **Version tracking**: Multiple avatar versions can coexist

### Recipe Cover Files
```
recipes/{recipe_id}/covers/{timestamp}-{filename}.{extension}
```

**Examples**:
- `recipes/4/covers/20250122-143022-chocolate-chip-cookies.jpg`
- `recipes/5/covers/20250122-143156-pasta-carbonara.webp`

**Benefits**:
- **Recipe association**: Clear link between image and recipe
- **Version control**: Multiple cover versions supported
- **Easy cleanup**: Recipe deletion can remove associated images
- **CDN optimization**: Efficient caching and delivery

### Temporary Files
```
{user_id}/{session_id}/{timestamp}-{filename}.tmp
```

**Examples**:
- `e1e70937-7dcb-425f-94e2-37365a579ca8/session_abc123/20250122-143022-upload.jpg.tmp`
- `b8511926-35f9-4619-97ac-3616e6ccae5c/processing/job_xyz789/20250122-143156-image.png.tmp`

**Benefits**:
- **Session tracking**: Upload progress can be monitored
- **Automatic cleanup**: Temporary files are easily identified
- **User isolation**: Prevents cross-user file access
- **Processing support**: Supports multi-step upload workflows

## Image Optimization

### Automatic Processing

#### Resizing
- **Avatar images**: Multiple sizes (40x40, 80x80, 160x160, 320x320)
- **Recipe covers**: Responsive sizes (300x200, 600x400, 1200x800)
- **Thumbnails**: Optimized for different display contexts

#### Format Conversion
- **Modern formats**: WebP for browsers that support it
- **Fallback formats**: JPG/PNG for older browsers
- **Quality optimization**: Automatic quality adjustment based on content

#### Compression
- **Lossy compression**: JPG for photographs
- **Lossless compression**: PNG for graphics and text
- **WebP optimization**: Best of both worlds when supported

### Delivery Optimization

#### CDN Integration
- **Global distribution**: Files served from edge locations
- **Caching strategy**: Aggressive caching for static content
- **Bandwidth optimization**: Reduced latency for global users

#### Responsive Images
```typescript
// Generate responsive image URLs
const generateImageUrls = (imageKey: string, sizes: number[]) => {
  return sizes.map(size => ({
    size,
    url: `${SUPABASE_URL}/storage/v1/object/public/public-media/${imageKey}?width=${size}`,
    srcset: `${SUPABASE_URL}/storage/v1/object/public/public-media/${imageKey}?width=${size} ${size}w`
  }));
};
```

#### Lazy Loading
```typescript
// Lazy load images for performance
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <img
      {...props}
      src={isLoaded ? src : placeholderSrc}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
    />
  );
};
```

## Upload Workflows

### Avatar Upload Process

#### 1. File Selection
```typescript
const handleAvatarSelect = (file: File) => {
  // Validate file
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  
  // Prepare upload
  setSelectedFile(file);
  setUploadProgress(0);
};
```

#### 2. Upload to Temporary Storage
```typescript
const uploadAvatar = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/2025/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  return data.path;
};
```

#### 3. Image Processing
```typescript
const processAvatar = async (filePath: string) => {
  // Generate multiple sizes
  const sizes = [40, 80, 160, 320];
  const processedImages = await Promise.all(
    sizes.map(size => resizeImage(filePath, size))
  );
  
  // Update user profile
  await updateUserAvatar(filePath);
  
  return processedImages;
};
```

### Recipe Cover Upload Process

#### 1. Recipe Creation
```typescript
const createRecipe = async (recipeData: RecipeData, coverFile?: File) => {
  // Create recipe first
  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single();
    
  if (error) throw error;
  
  // Upload cover if provided
  if (coverFile) {
    await uploadRecipeCover(recipe.id, coverFile);
  }
  
  return recipe;
};
```

#### 2. Cover Upload
```typescript
const uploadRecipeCover = async (recipeId: number, file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `recipes/${recipeId}/covers/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('public-media')
    .upload(filePath, file, {
      cacheControl: '86400', // 24 hours
      upsert: false
    });
    
  if (error) throw error;
  
  // Update recipe with cover image key
  await updateRecipeCover(recipeId, filePath);
  
  return data.path;
};
```

## Error Handling & Recovery

### Upload Failures

#### Network Issues
```typescript
const handleUploadError = (error: Error, file: File) => {
  if (error.message.includes('network')) {
    // Retry upload with exponential backoff
    return retryUpload(file, 3);
  }
  
  if (error.message.includes('size')) {
    // File too large, show user-friendly error
    setError('File is too large. Please choose a smaller image.');
    return;
  }
  
  // Log error for debugging
  console.error('Upload failed:', error);
  setError('Upload failed. Please try again.');
};
```

#### File Validation Errors
```typescript
const validateAndUpload = async (file: File) => {
  try {
    // Client-side validation
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Server-side validation
    await validateUploadedFile(file);
    
    // Proceed with upload
    return await uploadFile(file);
    
  } catch (error) {
    handleValidationError(error);
  }
};
```

### Recovery Procedures

#### Partial Upload Recovery
```typescript
const recoverPartialUpload = async (sessionId: string) => {
  // Check for incomplete uploads
  const { data: incompleteFiles } = await supabase.storage
    .from('temp-uploads')
    .list(`${userId}/${sessionId}`);
    
  if (incompleteFiles.length > 0) {
    // Resume upload process
    return await resumeUpload(sessionId, incompleteFiles);
  }
};
```

#### Cleanup Procedures
```typescript
const cleanupOrphanedFiles = async () => {
  // Find files without associated database records
  const orphanedFiles = await findOrphanedFiles();
  
  // Remove orphaned files
  for (const file of orphanedFiles) {
    await supabase.storage
      .from(file.bucket)
      .remove([file.path]);
  }
};
```

## Monitoring & Analytics

### Upload Metrics

#### Performance Tracking
```typescript
const trackUploadMetrics = (file: File, duration: number, success: boolean) => {
  analytics.track('file_upload', {
    file_size: file.size,
    file_type: file.type,
    upload_duration: duration,
    success,
    bucket: 'avatars',
    user_id: userId
  });
};
```

#### Storage Usage
```typescript
const getStorageUsage = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  const usage = await Promise.all(
    buckets.map(async bucket => {
      const { data: objects } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 1000 });
        
      return {
        bucket: bucket.name,
        file_count: objects.length,
        total_size: objects.reduce((sum, obj) => sum + obj.metadata.size, 0)
      };
    })
  );
  
  return usage;
};
```

### Health Monitoring

#### Bucket Health Checks
```typescript
const checkBucketHealth = async () => {
  const buckets = ['avatars', 'public-media', 'temp-uploads'];
  const health = {};
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
        
      health[bucket] = {
        status: error ? 'error' : 'healthy',
        error: error?.message,
        response_time: Date.now()
      };
    } catch (error) {
      health[bucket] = {
        status: 'error',
        error: error.message,
        response_time: Date.now()
      };
    }
  }
  
  return health;
};
```

## Future Enhancements

### Planned Features

#### Advanced Image Processing
- **AI-powered optimization**: Automatic image enhancement
- **Content-aware cropping**: Smart cropping based on image content
- **Background removal**: Automatic background removal for product images
- **Style transfer**: Apply artistic filters and styles

#### Enhanced Security
- **Watermarking**: Automatic watermark application
- **Content moderation**: AI-powered inappropriate content detection
- **Geographic restrictions**: Location-based access control
- **Advanced encryption**: Client-side encryption for sensitive files

#### Performance Improvements
- **Progressive uploads**: Resume interrupted uploads
- **Chunked uploads**: Support for very large files
- **Parallel processing**: Multiple file processing simultaneously
- **Edge computing**: Processing closer to users

### Scalability Considerations

#### Storage Growth
- **Tiered storage**: Hot/cold storage for cost optimization
- **Compression algorithms**: Advanced compression for storage efficiency
- **CDN optimization**: Global content distribution optimization
- **Backup strategies**: Comprehensive backup and disaster recovery

#### Performance Scaling
- **Load balancing**: Distribute upload load across multiple servers
- **Caching strategies**: Multi-level caching for optimal performance
- **Database optimization**: Optimize storage metadata queries
- **Monitoring expansion**: Comprehensive performance monitoring
