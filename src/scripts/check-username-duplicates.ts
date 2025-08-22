import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkUsernameDuplicates() {
  console.log('🔍 Checking for username issues in the database...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Check for duplicate usernames
    console.log('📊 Checking for duplicate usernames...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at')
      .order('username', { ascending: true });
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    // Group by username to find duplicates
    const usernameMap = new Map<string, any[]>();
    profiles?.forEach(profile => {
      if (profile.username) {
        if (!usernameMap.has(profile.username)) {
          usernameMap.set(profile.username, []);
        }
        usernameMap.get(profile.username)!.push(profile);
      }
    });
    
    // Find duplicates
    const duplicates: any[] = [];
    usernameMap.forEach((profiles, username) => {
      if (profiles.length > 1) {
        duplicates.push({ username, count: profiles.length, profiles });
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate usernames:\n`);
      duplicates.forEach(dup => {
        console.log(`Username: "${dup.username}" (${dup.count} users)`);
        dup.profiles.forEach((p: any) => {
          console.log(`  - ID: ${p.id}, Display: ${p.display_name}, Created: ${p.created_at}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ No duplicate usernames found');
    }
    
    // 2. Check for profiles without usernames
    console.log('\n📊 Checking for profiles without usernames...');
    const { data: nullUsernames, error: nullError } = await supabase
      .from('profiles')
      .select('id, display_name, created_at')
      .is('username', null);
    
    if (nullError) {
      console.error('❌ Error checking null usernames:', nullError);
    } else if (nullUsernames && nullUsernames.length > 0) {
      console.log(`⚠️  Found ${nullUsernames.length} profiles without usernames:`);
      nullUsernames.forEach(profile => {
        console.log(`  - ID: ${profile.id}, Display: ${profile.display_name}`);
      });
    } else {
      console.log('✅ All profiles have usernames');
    }
    
    // 3. Check specific usernames that might be problematic
    console.log('\n📊 Checking specific username cases...');
    const testUsernames = ['bamerson01', 'bamerson', 'user'];
    
    for (const username of testUsernames) {
      const { data: matches, error: matchError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .like('username', `${username}%`);
      
      if (matchError) {
        console.error(`❌ Error checking username ${username}:`, matchError);
      } else if (matches && matches.length > 0) {
        console.log(`\nUsername pattern "${username}*": ${matches.length} matches`);
        matches.forEach(m => {
          console.log(`  - ${m.username} (ID: ${m.id}, Display: ${m.display_name})`);
        });
      }
    }
    
    // 4. Summary statistics
    console.log('\n📈 Summary Statistics:');
    console.log(`Total profiles: ${profiles?.length || 0}`);
    console.log(`Unique usernames: ${usernameMap.size}`);
    console.log(`Duplicate usernames: ${duplicates.length}`);
    console.log(`Profiles without username: ${nullUsernames?.length || 0}`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkUsernameDuplicates().then(() => {
  console.log('\n✨ Username check completed');
}).catch(error => {
  console.error('💥 Check failed:', error);
});