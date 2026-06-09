'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';

type ActionResult = { ok: true; active?: boolean } | { ok: false; error: string };

/** Follow / unfollow another author. Returns active=true if now following. */
export async function toggleFollow(targetProfileId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Connectez-vous pour suivre.' };
  if (user.id === targetProfileId) return { ok: false, error: 'Action impossible.' };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetProfileId)
    .maybeSingle();

  if (existing) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetProfileId);
    revalidatePath('/[locale]/auteurs/[slug]', 'page');
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetProfileId });
  if (error) return { ok: false, error: 'Échec.' };

  revalidatePath('/[locale]/auteurs/[slug]', 'page');
  return { ok: true, active: true };
}

/** Like / unlike a publication. Returns active=true if now liked. */
export async function toggleLike(publicationId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Connectez-vous pour aimer.' };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('publication_id', publicationId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('user_id', user.id).eq('publication_id', publicationId);
    revalidatePath('/[locale]/publications/[slug]', 'page');
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: user.id, publication_id: publicationId });
  if (error) return { ok: false, error: 'Échec.' };

  revalidatePath('/[locale]/publications/[slug]', 'page');
  return { ok: true, active: true };
}

const commentSchema = z.object({
  publicationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export async function addComment(input: { publicationId: string; body: string }): Promise<ActionResult> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Commentaire invalide.' };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Connectez-vous pour commenter.' };

  const supabase = await createClient();
  const { error } = await supabase.from('comments').insert({
    publication_id: parsed.data.publicationId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: "Échec de l'envoi du commentaire." };

  revalidatePath('/[locale]/publications/[slug]', 'page');
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Non autorisé.' };

  const supabase = await createClient();
  // RLS allows delete only for the comment author or staff.
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) return { ok: false, error: 'Échec.' };

  revalidatePath('/[locale]/publications/[slug]', 'page');
  return { ok: true };
}
