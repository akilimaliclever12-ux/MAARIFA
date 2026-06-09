'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addComment, deleteComment } from '@/app/actions/social';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export interface CommentItem {
  id: string;
  body: string;
  created_at: string;
  authorName: string;
  authorSlug: string;
  canDelete: boolean;
}

export function Comments({
  publicationId,
  comments,
  isAuthed,
  locale,
  dict,
}: {
  publicationId: string;
  comments: CommentItem[];
  isAuthed: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addComment({ publicationId, body });
      if (!res.ok) setError(res.error);
      else {
        setBody('');
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteComment(id);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">
        {dict.social.comments} · {comments.length}
      </h2>

      {isAuthed ? (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={dict.social.commentPlaceholder}
            rows={2}
            maxLength={2000}
            className="w-full rounded-md border border-stone/30 px-3 py-2 text-sm outline-none focus:border-lake focus:ring-1 focus:ring-lake"
          />
          {error && <p className="text-sm text-clay">{error}</p>}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-md bg-lake px-4 py-2 text-sm font-medium text-white hover:bg-lake-dark disabled:opacity-60"
          >
            {dict.social.send}
          </button>
        </form>
      ) : (
        <p className="text-sm text-stone">
          <Link href={`/${locale}/connexion`} className="text-lake hover:underline">
            {dict.social.loginToComment}
          </Link>
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-stone">{dict.social.noComments}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-stone/15 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/${locale}/auteurs/${c.authorSlug}`}
                  className="text-sm font-medium text-lake hover:underline"
                >
                  {c.authorName}
                </Link>
                <span className="text-xs text-stone">
                  {new Date(c.created_at).toLocaleDateString(locale)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">{c.body}</p>
              {c.canDelete && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={pending}
                  className="mt-2 text-xs text-stone underline hover:text-clay"
                >
                  {dict.social.delete}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
