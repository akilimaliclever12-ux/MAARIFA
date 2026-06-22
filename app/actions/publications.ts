'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';
import {
  publicationCreateSchema,
  publicationUpdateSchema,
  type PublicationCreateInput,
  type PublicationUpdateInput,
} from '@/lib/validation/publication';
import { publicationSlug, slugify } from '@/lib/utils/slug';
import {
  sendEmail,
  emailPublicationApproved,
  emailPublicationRejected,
  emailNewPendingPublication,
} from '@/lib/email/resend';
import { getSiteUrl } from '@/lib/site-url';

const SITE_URL = getSiteUrl();

// Where new-submission notifications go. Set ADMIN_NOTIFY_EMAIL in env.
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? 'akilimaliclever12@gmail.com';

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// Fetch owner email + title/slug for notification emails. Uses the caller's
// (staff) session — profiles are world-readable and staff can read all publications.
async function getOwnerContact(db: SupabaseServer, publicationId: string) {
  const { data } = await db
    .from('publications')
    .select('title, slug, profiles!publications_owner_id_fkey ( email, full_name )')
    .eq('id', publicationId)
    .maybeSingle();
  const profile = (data as { profiles?: { email: string | null; full_name: string | null } } | null)
    ?.profiles;
  return {
    title: (data as { title?: string } | null)?.title ?? '',
    slug: (data as { slug?: string } | null)?.slug ?? '',
    email: profile?.email ?? null,
    fullName: profile?.full_name ?? '',
  };
}

type ActionResult = { ok: true; slug?: string } | { ok: false; error: string };

/**
 * Create a publication (draft or pending). The PDF is already uploaded to
 * Storage by the browser; we receive its path/metadata. Runs under the user's
 * RLS session, so it can only write rows it owns.
 */
export async function createPublication(input: PublicationCreateInput): Promise<ActionResult> {
  const parsed = publicationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const data = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Vous devez être connecté.' };

  const supabase = await createClient();
  const slug = publicationSlug(data.title);

  // 1. Insert the publication row.
  const { data: pub, error: pubErr } = await supabase
    .from('publications')
    .insert({
      owner_id: user.id,
      title: data.title,
      slug,
      abstract: data.abstract || null,
      abstract_align: data.abstractAlign,
      thumbnail_url: data.thumbnailUrl || null,
      type: data.type,
      university_id: data.universityId ?? null,
      category_id: data.categoryId ?? null,
      year: data.year ?? null,
      language: data.language,
      status: data.status,
    })
    .select('id, slug')
    .single();

  if (pubErr || !pub) {
    return { ok: false, error: "Échec de l'enregistrement de la publication." };
  }

  // 2. Link the uploaded file.
  const { error: fileErr } = await supabase.from('publication_files').insert({
    publication_id: pub.id,
    storage_path: data.storagePath,
    file_name: data.fileName,
    file_size: data.fileSize,
    mime_type: 'application/pdf',
    is_primary: true,
  });
  if (fileErr) {
    // Roll back the orphan publication row to keep things clean.
    await supabase.from('publications').delete().eq('id', pub.id);
    return { ok: false, error: "Échec de l'enregistrement du fichier." };
  }

  // 3. Keywords (upsert by slug) + links.
  if (data.keywords.length > 0) {
    const rows = data.keywords.map((name) => ({ name, slug: slugify(name) }));
    await supabase.from('keywords').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
    const { data: kw } = await supabase
      .from('keywords')
      .select('id, slug')
      .in('slug', rows.map((r) => r.slug));
    if (kw && kw.length > 0) {
      await supabase
        .from('publication_keywords')
        .insert(kw.map((k) => ({ publication_id: pub.id, keyword_id: k.id })));
    }
  }

  // 4. Authors: owner first, then any co-authors.
  const authors = [
    { publication_id: pub.id, profile_id: user.id, author_name: user.fullName, position: 1 },
    ...data.coAuthors.map((name, i) => ({
      publication_id: pub.id,
      profile_id: null,
      author_name: name,
      position: i + 2,
    })),
  ];
  await supabase.from('publication_authors').insert(authors);

  revalidatePath('/[locale]/espace', 'page');
  if (data.status === 'pending') {
    revalidatePath('/[locale]/admin/moderation', 'page');
    // Notify the moderator that something is waiting (no-ops if email not configured).
    const tpl = emailNewPendingPublication({
      title: data.title,
      authorName: user.fullName,
      moderationUrl: `${SITE_URL}/fr/admin/moderation`,
    });
    await sendEmail({ to: ADMIN_NOTIFY_EMAIL, ...tpl });
  }

  return { ok: true, slug: pub.slug };
}

/**
 * Edit an existing publication the user owns (draft or rejected only), then
 * keep it as a draft or submit it for moderation. Runs under the owner's RLS.
 */
export async function updatePublication(input: PublicationUpdateInput): Promise<ActionResult> {
  const parsed = publicationUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const data = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Vous devez être connecté.' };

  const supabase = await createClient();

  // Verify ownership + that it's still editable.
  const { data: existing } = await supabase
    .from('publications')
    .select('id, owner_id, status, slug')
    .eq('id', data.id)
    .maybeSingle();
  if (!existing || existing.owner_id !== user.id) {
    return { ok: false, error: 'Action non autorisée.' };
  }
  if (!['draft', 'rejected'].includes(existing.status)) {
    return { ok: false, error: 'Cette publication ne peut plus être modifiée.' };
  }

  // 1. Update the main row.
  const patch: Record<string, unknown> = {
    title: data.title,
    abstract: data.abstract || null,
    abstract_align: data.abstractAlign,
    type: data.type,
    university_id: data.universityId ?? null,
    category_id: data.categoryId ?? null,
    year: data.year ?? null,
    language: data.language,
    status: data.status,
    rejection_reason: null,
    published_at: null,
  };
  if (data.thumbnailUrl) patch.thumbnail_url = data.thumbnailUrl;

  const { error: upErr } = await supabase.from('publications').update(patch).eq('id', data.id);
  if (upErr) return { ok: false, error: "Échec de l'enregistrement." };

  // 2. Replace the primary file if a new PDF was uploaded.
  if (data.storagePath && data.fileName && data.fileSize) {
    const { data: oldFile } = await supabase
      .from('publication_files')
      .select('id, storage_path')
      .eq('publication_id', data.id)
      .eq('is_primary', true)
      .maybeSingle();
    if (oldFile) {
      await supabase
        .from('publication_files')
        .update({ storage_path: data.storagePath, file_name: data.fileName, file_size: data.fileSize })
        .eq('id', oldFile.id);
      if (oldFile.storage_path && oldFile.storage_path !== data.storagePath) {
        await supabase.storage.from('publications').remove([oldFile.storage_path]);
      }
    } else {
      await supabase.from('publication_files').insert({
        publication_id: data.id,
        storage_path: data.storagePath,
        file_name: data.fileName,
        file_size: data.fileSize,
        is_primary: true,
      });
    }
  }

  // 3. Replace keywords.
  await supabase.from('publication_keywords').delete().eq('publication_id', data.id);
  if (data.keywords.length > 0) {
    const rows = data.keywords.map((name) => ({ name, slug: slugify(name) }));
    await supabase.from('keywords').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
    const { data: kw } = await supabase
      .from('keywords')
      .select('id, slug')
      .in('slug', rows.map((r) => r.slug));
    if (kw && kw.length > 0) {
      await supabase
        .from('publication_keywords')
        .insert(kw.map((k) => ({ publication_id: data.id, keyword_id: k.id })));
    }
  }

  // 4. Replace authors (owner first, then co-authors).
  await supabase.from('publication_authors').delete().eq('publication_id', data.id);
  await supabase.from('publication_authors').insert([
    { publication_id: data.id, profile_id: user.id, author_name: user.fullName, position: 1 },
    ...data.coAuthors.map((name, i) => ({
      publication_id: data.id,
      profile_id: null,
      author_name: name,
      position: i + 2,
    })),
  ]);

  revalidatePath('/[locale]/espace', 'page');
  if (data.status === 'pending') {
    revalidatePath('/[locale]/admin/moderation', 'page');
    const tpl = emailNewPendingPublication({
      title: data.title,
      authorName: user.fullName,
      moderationUrl: `${SITE_URL}/fr/admin/moderation`,
    });
    await sendEmail({ to: ADMIN_NOTIFY_EMAIL, ...tpl });
  }

  return { ok: true, slug: existing.slug };
}

/** Approve a pending publication. Staff only. */
export async function approvePublication(publicationId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return { ok: false, error: 'Action non autorisée.' };

  // Runs under the staff member's session; the pub_staff_all RLS policy allows it.
  const supabase = await createClient();
  const contact = await getOwnerContact(supabase, publicationId);
  const { error } = await supabase
    .from('publications')
    .update({ status: 'published', published_at: new Date().toISOString(), rejection_reason: null })
    .eq('id', publicationId)
    .eq('status', 'pending');
  if (error) return { ok: false, error: "Échec de l'approbation." };

  // Best-effort audit log (ignored if the insert policy isn't present).
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'publication.approve',
    entity_type: 'publication',
    entity_id: publicationId,
  });

  if (contact.email) {
    const tpl = emailPublicationApproved({
      fullName: contact.fullName,
      title: contact.title,
      url: `${SITE_URL}/fr/publications/${contact.slug}`,
    });
    await sendEmail({ to: contact.email, ...tpl });
  }

  revalidatePath('/[locale]/admin/moderation', 'page');
  return { ok: true };
}

/** Reject a pending publication with a reason. Staff only. */
export async function rejectPublication(
  publicationId: string,
  reason: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return { ok: false, error: 'Action non autorisée.' };

  const trimmed = reason.trim();
  if (trimmed.length < 3) return { ok: false, error: 'Motif requis.' };

  const supabase = await createClient();
  const contact = await getOwnerContact(supabase, publicationId);
  const { error } = await supabase
    .from('publications')
    .update({ status: 'rejected', rejection_reason: trimmed })
    .eq('id', publicationId)
    .eq('status', 'pending');
  if (error) return { ok: false, error: 'Échec du rejet.' };

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'publication.reject',
    entity_type: 'publication',
    entity_id: publicationId,
    metadata: { reason: trimmed },
  });

  if (contact.email) {
    const tpl = emailPublicationRejected({
      fullName: contact.fullName,
      title: contact.title,
      reason: trimmed,
    });
    await sendEmail({ to: contact.email, ...tpl });
  }

  revalidatePath('/[locale]/admin/moderation', 'page');
  return { ok: true };
}

/** Generate a short-lived signed URL so staff can review a pending PDF. */
export async function getReviewUrl(storagePath: string): Promise<ActionResult & { url?: string }> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return { ok: false, error: 'Action non autorisée.' };

  // Staff can read objects in the publications bucket (storage RLS), so the
  // session client can sign the URL — no service-role key required.
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('publications')
    .createSignedUrl(storagePath, 120); // 2 minutes
  if (error || !data) return { ok: false, error: 'Lien indisponible.' };

  return { ok: true, url: data.signedUrl };
}

/**
 * Signed URL of a publication's primary PDF, for the owner or staff to
 * regenerate a missing thumbnail. Does NOT count as a download.
 */
export async function getThumbnailSourceUrl(
  publicationId: string,
): Promise<ActionResult & { url?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Non autorisé.' };

  const supabase = await createClient();
  const { data: pub } = await supabase
    .from('publications')
    .select('owner_id, publication_files ( storage_path, is_primary )')
    .eq('id', publicationId)
    .maybeSingle();

  const row = pub as
    | { owner_id: string; publication_files: { storage_path: string; is_primary: boolean }[] | null }
    | null;
  if (!row) return { ok: false, error: 'Introuvable.' };
  if (row.owner_id !== user.id && !isStaffRole(user.role)) {
    return { ok: false, error: 'Non autorisé.' };
  }

  const files = row.publication_files ?? [];
  const primary = files.find((f) => f.is_primary) ?? files[0];
  if (!primary) return { ok: false, error: 'Fichier introuvable.' };

  const { data, error } = await supabase.storage
    .from('publications')
    .createSignedUrl(primary.storage_path, 120);
  if (error || !data) return { ok: false, error: 'Lien indisponible.' };

  return { ok: true, url: data.signedUrl };
}

/** Set a publication's thumbnail URL (owner or staff). */
export async function setPublicationThumbnail(
  publicationId: string,
  thumbnailUrl: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Non autorisé.' };
  if (!/^https?:\/\//.test(thumbnailUrl) || thumbnailUrl.length > 500) {
    return { ok: false, error: 'URL invalide.' };
  }

  const supabase = await createClient();
  const { data: pub } = await supabase
    .from('publications')
    .select('owner_id')
    .eq('id', publicationId)
    .maybeSingle();

  const row = pub as { owner_id: string } | null;
  if (!row) return { ok: false, error: 'Introuvable.' };
  if (row.owner_id !== user.id && !isStaffRole(user.role)) {
    return { ok: false, error: 'Non autorisé.' };
  }

  const { error } = await supabase
    .from('publications')
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', publicationId);
  if (error) return { ok: false, error: 'Échec.' };

  revalidatePath('/[locale]/publications/[slug]', 'page');
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/publications', 'page');
  return { ok: true };
}
