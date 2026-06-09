'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';

type ActionResult = { ok: true } | { ok: false; error: string };

const REASONS = ['plagiat', 'contenu_inapproprie', 'droit_auteur', 'spam', 'autre'] as const;

const reportSchema = z.object({
  publicationId: z.string().uuid(),
  reason: z.enum(REASONS),
  details: z.string().trim().max(2000).optional().or(z.literal('')),
});

/** File a report. Allowed for anyone (anonymous included) per RLS. */
export async function createReport(input: {
  publicationId: string;
  reason: string;
  details?: string;
}): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Données invalides.' };

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase.from('reports').insert({
    publication_id: parsed.data.publicationId,
    reporter_id: user?.id ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });

  if (error) return { ok: false, error: "Échec de l'envoi du signalement." };
  return { ok: true };
}

/** Update a report's status. Staff only. */
export async function updateReportStatus(
  reportId: string,
  status: 'dismissed' | 'actioned',
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return { ok: false, error: 'Action non autorisée.' };

  // Staff session; reports_staff RLS policy permits the update.
  const supabase = await createClient();
  const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
  if (error) return { ok: false, error: 'Échec de la mise à jour.' };

  // Best-effort audit log.
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: `report.${status}`,
    entity_type: 'report',
    entity_id: reportId,
  });

  revalidatePath('/[locale]/admin', 'page');
  return { ok: true };
}
