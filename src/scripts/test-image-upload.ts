import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testImageUpload() {
  console.log('🔍 Testing Supabase Storage Configuration...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. List all buckets
    console.log('📦 Listing all storage buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    // 2. Check if public-media bucket exists
    const publicMediaBucket = buckets?.find(b => b.name === 'public-media');
    if (!publicMediaBucket) {
      console.log('\n⚠️  public-media bucket does not exist!');
      console.log('Creating public-media bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('public-media', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Created public-media bucket successfully');
    } else {
      console.log('\n✅ public-media bucket exists');
      console.log('Bucket details:', publicMediaBucket);
    }
    
    // 3. Test upload a sample file
    console.log('\n📤 Testing file upload...');
    const testImagePath = `recipes/test-user/covers/${Date.now()}-test.txt`;
    const testContent = 'This is a test file for storage verification';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-media')
      .upload(testImagePath, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError);
    } else {
      console.log('✅ Test file uploaded successfully:', uploadData);
      
      // 4. Get public URL
      const { data: urlData } = supabase.storage
        .from('public-media')
        .getPublicUrl(testImagePath);
      
      console.log('🔗 Public URL:', urlData.publicUrl);
      
      // 5. List files in the bucket
      console.log('\n📂 Listing files in public-media bucket:');
      const { data: files, error: listError } = await supabase.storage
        .from('public-media')
        .list('recipes', {
          limit: 10,
          offset: 0
        });
      
      if (listError) {
        console.error('❌ Error listing files:', listError);
      } else {
        console.log('Files found:', files?.length || 0);
        files?.forEach(file => {
          console.log(`  - ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
      
      // 6. Clean up test file
      console.log('\n🧹 Cleaning up test file...');
      const { error: deleteError } = await supabase.storage
        .from('public-media')
        .remove([testImagePath]);
      
      if (deleteError) {
        console.error('❌ Error deleting test file:', deleteError);
      } else {
        console.log('✅ Test file deleted successfully');
      }
    }
    
    // 7. Check RLS policies
    console.log('\n🔒 Checking storage policies...');
    // Note: This requires database access to check RLS policies
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testImageUpload().then(() => {
  console.log('\n✨ Storage test completed');
}).catch(error => {
  console.error('💥 Test failed:', error);
});