import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/types/db';

export interface CurrentUser {
  id: string;
  fullName: string;
  role: Role;
}

// Returns the signed-in user's id + profile (role, name), or null if not signed in.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!data) return null;
  return { id: data.id, fullName: data.full_name, role: data.role };
}

export function isStaffRole(role: Role): boolean {
  return role === 'moderator' || role === 'admin';
}
