'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validation/profile';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const data = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Vous devez être connecté.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      bio: data.bio || null,
      university_id: data.universityId ?? null,
    })
    .eq('id', user.id);

  if (error) return { ok: false, error: 'Échec de la mise à jour du profil.' };

  revalidatePath('/[locale]/espace', 'page');
  return { ok: true };
}
