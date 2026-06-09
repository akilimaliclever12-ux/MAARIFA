'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFollow } from '@/app/actions/social';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function FollowButton({
  targetProfileId,
  initialFollowing,
  initialCount,
  isAuthed,
  locale,
  dict,
}: {
  targetProfileId: string;
  initialFollowing: boolean;
  initialCount: number;
  isAuthed: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isAuthed) {
      router.push(`/${locale}/connexion`);
      return;
    }
    const next = !following;
    setFollowing(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleFollow(targetProfileId);
      if (!res.ok) {
        setFollowing(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={following}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          following
            ? 'border border-stone/30 bg-white text-ink hover:bg-mist'
            : 'bg-lake text-white hover:bg-lake-dark'
        }`}
      >
        {following ? dict.social.following : dict.social.follow}
      </button>
      <span className="text-sm text-stone">
        {count} {dict.social.followers}
      </span>
    </div>
  );
}
