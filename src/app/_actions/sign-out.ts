'use server';

import { getServerSupabase } from '@/lib/db/server';
import { redirect } from 'next/navigation';

export async function signOutAction() {
  const sb = await getServerSupabase();
  await sb.auth.signOut();
  redirect('/');
}