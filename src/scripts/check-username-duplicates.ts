import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkUsernameDuplicates() {  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Check for duplicate usernames    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at')
      .order('username', { ascending: true });
    
    if (profilesError) {      return;
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
    
    if (duplicates.length > 0) {      duplicates.forEach(dup => {        dup.profiles.forEach((p: any) => {        });      });
    } else {    }
    
    // 2. Check for profiles without usernames    const { data: nullUsernames, error: nullError } = await supabase
      .from('profiles')
      .select('id, display_name, created_at')
      .is('username', null);
    
    if (nullError) {    } else if (nullUsernames && nullUsernames.length > 0) {      nullUsernames.forEach(profile => {      });
    } else {    }
    
    // 3. Check specific usernames that might be problematic    const testUsernames = ['bamerson01', 'bamerson', 'user'];
    
    for (const username of testUsernames) {
      const { data: matches, error: matchError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .like('username', `${username}%`);
      
      if (matchError) {      } else if (matches && matches.length > 0) {        matches.forEach(m => {        });
      }
    }
    
    // 4. Summary statistics    
  } catch (error) {  }
}

// Run the check
checkUsernameDuplicates().then(() => {}).catch(error => {});