// Client-only: render page 1 of a PDF File to a small JPEG Blob using pdf.js.
// Best-effort — returns null on any failure so publishing never breaks.
// pdf.js is dynamically imported so it only loads when a user actually uploads.
export async function generatePdfThumbnail(file: File, maxWidth = 600): Promise<Blob | null> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Match the worker to the installed version (loaded from CDN at upload time).
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
