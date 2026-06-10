import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

interface PubFile {
  storage_path: string;
  file_name: string;
  is_primary: boolean;
}

// GET /api/telecharger/<publicationId>
// Counts the download, then 307-redirects to a short-lived signed URL that
// forces a file download. Works for anonymous and authenticated users.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: pub } = await supabase
    .from('publications')
    .select('id, status, publication_files ( storage_path, file_name, is_primary )')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (!pub) {
    return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  }

  const files = (pub.publication_files ?? []) as unknown as PubFile[];
  const primary = files.find((f) => f.is_primary) ?? files[0];
  if (!primary) {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }

  // Hash the client IP for privacy-preserving dedup/analytics.
  const ip = _req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ipHash = ip
    ? createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'maarifa')).digest('hex')
    : null;

  // Count the download (RPC is SECURITY DEFINER; captures auth.uid() if present).
  await supabase.rpc('increment_download', { p_publication_id: id, p_ip_hash: ipHash });

  // Sign the URL with the session/anon client. The "pub_select_published"
  // storage policy (docs/14) lets anyone read files of published publications,
  // so no service-role key is needed.
  const { data: signed, error } = await supabase.storage
    .from('publications')
    .createSignedUrl(primary.storage_path, 120, { download: primary.file_name });

  if (error || !signed) {
    return NextResponse.json({ error: 'Lien de téléchargement indisponible.' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl, 307);
}
