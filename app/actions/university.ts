'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';

type ActionResult = { ok: true } | { ok: false; error: string };

/** Update a university's logo. Allowed for a manager of that university or staff. */
export async function updateUniversityLogo(
  universityId: string,
  logoUrl: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Non autorisé.' };
  if (!/^https?:\/\//.test(logoUrl) || logoUrl.length > 500) {
    return { ok: false, error: 'URL invalide.' };
  }

  const supabase = await createClient();

  if (!isStaffRole(user.role)) {
    const { data } = await supabase
      .from('university_managers')
      .select('university_id')
      .eq('user_id', user.id)
      .eq('university_id', universityId)
      .maybeSingle();
    if (!data) return { ok: false, error: 'Non autorisé.' };
  }

  const { error } = await supabase
    .from('universities')
    .update({ logo_url: logoUrl })
    .eq('id', universityId);
  if (error) return { ok: false, error: 'Échec de la mise à jour.' };

  revalidatePath('/[locale]/espace/universite', 'page');
  revalidatePath('/[locale]/universites', 'page');
  revalidatePath('/[locale]/universites/[slug]', 'page');
  return { ok: true };
}
