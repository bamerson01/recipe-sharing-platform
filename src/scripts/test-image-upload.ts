import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testImageUpload() {  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. List all buckets    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {      return;
    }    
    // 2. Check if public-media bucket exists
    const publicMediaBucket = buckets?.find(b => b.name === 'public-media');
    if (!publicMediaBucket) {      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('public-media', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {        return;
      }    } else {    }
    
    // 3. Test upload a sample file    const testImagePath = `recipes/test-user/covers/${Date.now()}-test.txt`;
    const testContent = 'This is a test file for storage verification';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-media')
      .upload(testImagePath, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {    } else {      
      // 4. Get public URL
      const { data: urlData } = supabase.storage
        .from('public-media')
        .getPublicUrl(testImagePath);      
      // 5. List files in the bucket      const { data: files, error: listError } = await supabase.storage
        .from('public-media')
        .list('recipes', {
          limit: 10,
          offset: 0
        });
      
      if (listError) {      } else {        files?.forEach(file => {        });
      }
      
      // 6. Clean up test file      const { error: deleteError } = await supabase.storage
        .from('public-media')
        .remove([testImagePath]);
      
      if (deleteError) {      } else {      }
    }
    
    // 7. Check RLS policies    // Note: This requires database access to check RLS policies
    
  } catch (error) {  }
}

// Run the test
testImageUpload().then(() => {}).catch(error => {});