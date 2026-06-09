'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleLike } from '@/app/actions/social';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function LikeButton({
  publicationId,
  initialCount,
  initialLiked,
  isAuthed,
  locale,
  dict,
}: {
  publicationId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthed: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isAuthed) {
      router.push(`/${locale}/connexion`);
      return;
    }
    // Optimistic update.
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(publicationId);
      if (!res.ok) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        liked ? 'border-clay bg-clay/10 text-clay' : 'border-stone/30 text-ink hover:bg-mist'
      }`}
    >
      <span aria-hidden>{liked ? '♥' : '♡'}</span>
      <span>{liked ? dict.social.liked : dict.social.like}</span>
      <span className="text-stone">· {count}</span>
    </button>
  );
}
