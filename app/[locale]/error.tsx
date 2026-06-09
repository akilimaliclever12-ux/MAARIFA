'use client';

// Localized error boundary. Kept minimal and self-contained (no dict import,
// since this can render before data loads); shows FR + EN to stay bilingual.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold text-ink">Une erreur est survenue</h1>
      <p className="mt-1 text-sm text-stone">Something went wrong.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
      >
        Réessayer / Try again
      </button>
    </div>
  );
}
