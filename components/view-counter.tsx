'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/browser';

// Records a view once when a published publication page is opened.
// Calls the increment_view RPC (SECURITY DEFINER, granted to anon+authenticated).
// Renders nothing.
export function ViewCounter({ publicationId }: { publicationId: string }) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    const supabase = createClient();
    void supabase.rpc('increment_view', { p_publication_id: publicationId });
  }, [publicationId]);

  return null;
}
