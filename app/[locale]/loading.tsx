export default function Loading() {
  return (
    <div className="space-y-4 py-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-2/3 animate-pulse rounded bg-stone/15" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-stone/10" />
        ))}
      </div>
    </div>
  );
}
