import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkRecipeImages() {  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Get recipes with cover images
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, cover_image_key, created_at, updated_at')
      .not('cover_image_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recipesError) {      return;
    }    
    for (const recipe of recipes || []) {      
      // Check if the image actually exists in storage
      if (recipe.cover_image_key) {
        const { data: files, error: listError } = await supabase.storage
          .from('public-media')
          .list(recipe.cover_image_key.split('/').slice(0, -1).join('/'), {
            search: recipe.cover_image_key.split('/').pop()
          });
        
        if (listError) {        } else if (files && files.length > 0) {          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('public-media')
            .getPublicUrl(recipe.cover_image_key);        } else {        }
      }    }
    
    // 2. Check storage bucket contents    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('public-media')
      .list('recipes', {
        limit: 100,
        offset: 0
      });
    
    if (storageError) {    } else {      
      // List subdirectories
      const folders = storageFiles?.filter(f => !f.id) || [];
      const files = storageFiles?.filter(f => f.id) || [];
      
      if (folders.length > 0) {        folders.forEach(folder => {        });
      }
      
      if (files.length > 0) {        files.forEach(file => {        });
      }
    }
    
    // 3. Check for recipes without images    const { count: totalRecipes } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });
    
    const { count: recipesWithImages } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .not('cover_image_key', 'is', null);    
  } catch (error) {  }
}

// Run the check
checkRecipeImages().then(() => {}).catch(error => {});