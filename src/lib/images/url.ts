import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

export function imageSrcFromKey(key?: string | null, version?: string | number) {
  if (!key) return null;
  const publicUrl = supabase.storage.from('public-media').getPublicUrl(key).data.publicUrl;
  return version ? `${publicUrl}?v=${version}` : publicUrl;
}
