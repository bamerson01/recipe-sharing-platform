import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkRecipeImages() {
  console.log('🔍 Checking recipe images in database...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Get recipes with cover images
    console.log('📚 Fetching recipes with cover_image_key...');
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, cover_image_key, created_at, updated_at')
      .not('cover_image_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError);
      return;
    }
    
    console.log(`Found ${recipes?.length || 0} recipes with cover images:\n`);
    
    for (const recipe of recipes || []) {
      console.log(`📖 Recipe: "${recipe.title}" (ID: ${recipe.id})`);
      console.log(`   Image Key: ${recipe.cover_image_key}`);
      console.log(`   Created: ${recipe.created_at}`);
      
      // Check if the image actually exists in storage
      if (recipe.cover_image_key) {
        const { data: files, error: listError } = await supabase.storage
          .from('public-media')
          .list(recipe.cover_image_key.split('/').slice(0, -1).join('/'), {
            search: recipe.cover_image_key.split('/').pop()
          });
        
        if (listError) {
          console.log(`   ❌ Error checking file: ${listError.message}`);
        } else if (files && files.length > 0) {
          console.log(`   ✅ Image exists in storage (${files[0].metadata?.size || 0} bytes)`);
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('public-media')
            .getPublicUrl(recipe.cover_image_key);
          console.log(`   🔗 Public URL: ${urlData.publicUrl}`);
        } else {
          console.log(`   ⚠️  Image NOT found in storage!`);
        }
      }
      console.log('');
    }
    
    // 2. Check storage bucket contents
    console.log('\n📦 Checking storage bucket contents...');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('public-media')
      .list('recipes', {
        limit: 100,
        offset: 0
      });
    
    if (storageError) {
      console.error('❌ Error listing storage files:', storageError);
    } else {
      console.log(`Found ${storageFiles?.length || 0} items in recipes folder`);
      
      // List subdirectories
      const folders = storageFiles?.filter(f => !f.id) || [];
      const files = storageFiles?.filter(f => f.id) || [];
      
      if (folders.length > 0) {
        console.log('\n📁 Folders:');
        folders.forEach(folder => {
          console.log(`   - ${folder.name}/`);
        });
      }
      
      if (files.length > 0) {
        console.log('\n📄 Files:');
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
    }
    
    // 3. Check for recipes without images
    console.log('\n📊 Statistics:');
    const { count: totalRecipes } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });
    
    const { count: recipesWithImages } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .not('cover_image_key', 'is', null);
    
    console.log(`Total recipes: ${totalRecipes}`);
    console.log(`Recipes with images: ${recipesWithImages}`);
    console.log(`Recipes without images: ${(totalRecipes || 0) - (recipesWithImages || 0)}`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkRecipeImages().then(() => {
  console.log('\n✨ Check completed');
}).catch(error => {
  console.error('💥 Check failed:', error);
});