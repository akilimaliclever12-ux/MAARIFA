import Link from 'next/link';

// Localized 404. No locale param is available here, so we default to French
// copy with an English line and link to the FR home (middleware re-localizes).
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold text-ink">Page introuvable</h1>
      <p className="mt-1 text-sm text-stone">
        Cette page n&apos;existe pas ou a été déplacée. (Page not found.)
      </p>
      <Link
        href="/fr"
        className="mt-6 inline-block rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
      >
        Accueil / Home
      </Link>
    </div>
  );
}
