/**
 * Best-effort PDF page count from the raw file bytes. Two strategies, ordered
 * by reliability:
 *
 *   1. Extract "/Count N" from the root /Type/Pages dictionary — this field
 *      is usually in an UNCOMPRESSED section of the PDF because the root
 *      catalog and Pages tree must be reachable via the cross-reference table.
 *      Correct on virtually every modern PDF (CAD exports, Acrobat, printer
 *      drivers, ghostscript, etc.).
 *   2. Count "/Type /Page" occurrences (excluding "/Pages") — only works on
 *      older uncompressed PDFs; modern object-stream PDFs won't expose these
 *      markers in plaintext.
 *
 * Returns null on any error or when neither pattern matches. Callers should
 * treat null as "unknown" — do NOT gate behavior on it, only show it if useful.
 */
export async function countPdfPages(file: File): Promise<number | null> {
  try {
    const buf = await file.arrayBuffer();
    // Cap decoded window at ~8MB — plenty for finding the Pages dict, which
    // typically lives near the trailer or at the top of the file. Very large
    // PDFs (100+ MB technical drawings) don't need the whole file scanned.
    const bytes = new Uint8Array(buf, 0, Math.min(buf.byteLength, 8 * 1024 * 1024));
    // latin1 is a lossless byte-to-char mapping — no transcoding surprises.
    const text = new TextDecoder('latin1').decode(bytes);

    // Strategy 1: /Type /Pages ... /Count N — the ROOT pages dict.
    // A PDF may contain intermediate /Pages nodes with their own /Count entries,
    // but they always live INSIDE the root's /Kids tree, so scanning all matches
    // and taking the MAX gives the total page count for the document.
    let bestFromRoot: number | null = null;
    const pagesRe = /\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g;
    let m: RegExpExecArray | null;
    while ((m = pagesRe.exec(text)) !== null) {
      const n = Number(m[1]);
      if (n > 0 && (bestFromRoot === null || n > bestFromRoot)) bestFromRoot = n;
    }
    if (bestFromRoot !== null) return bestFromRoot;

    // Strategy 2 (fallback): count /Type /Page occurrences.
    const pageRe = /\/Type\s*\/Page\b(?!s)/g;
    let count = 0;
    while (pageRe.exec(text) !== null) count++;
    return count > 0 ? count : null;
  } catch {
    return null;
  }
}
