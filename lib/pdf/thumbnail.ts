// Client-only: render page 1 of a PDF File to a small JPEG Blob using pdf.js.
// Best-effort — returns null on any failure so publishing never breaks.
// pdf.js is dynamically imported so it only loads when a user actually uploads.
export async function generatePdfThumbnail(file: File, maxWidth = 600): Promise<Blob | null> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Self-hosted worker (copied from pdfjs-dist into /public) — reliable on
    // weak connections, no external CDN. Re-copy this file if pdfjs-dist is
    // upgraded so the worker version matches the library.
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const page = await doc.getPage(1);

    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1, maxWidth / base.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7),
    );
  } catch {
    return null;
  }
}
