import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QrFileInfo, QrTagResult } from './qr.model';

/** Thrown when the hub answered 403 — a signed-in account without plant access. Distinct from offline. */
export class QrForbiddenError extends Error {}

/**
 * Scanned-tag API, with a small offline mirror.
 *
 * Network first (a tag's drawings can change), falling back to the last answer this device saw for the
 * same tag or file. That pairs with LotoDrawingService, which already caches the drawing BLOBS in
 * IndexedDB keyed by file id: between the two, a label scanned once opens again with no signal — which
 * is the normal condition in half the plant.
 *
 * Descriptors are small JSON, so localStorage is the right store here (IndexedDB is reserved for blobs).
 * Both caches are capped and evict oldest-first, so a phone that scans hundreds of labels cannot grow
 * the entry without bound.
 */
@Injectable({ providedIn: 'root' })
export class QrApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/qr`;

  private readonly TAG_CACHE = 'qr-tag-cache-v1';
  private readonly FILE_CACHE = 'qr-file-cache-v1';
  private readonly MAX_ENTRIES = 40;

  /**
   * Resolve a scanned tag. Returns the cached answer when the request fails for any transport reason;
   * a 403 rethrows as {@link QrForbiddenError} so the page can say "this account has no plant access"
   * instead of silently showing a stale drawing.
   */
  async resolveTag(tag: string): Promise<QrTagResult | null> {
    try {
      const r = await firstValueFrom(
        this.http.get<{ responseData: QrTagResult }>(`${this.base}/tag/${encodeURIComponent(tag)}`).pipe(timeout(20000))
      );
      const result = r?.responseData ?? null;
      if (result) this.write(this.TAG_CACHE, tag.toLowerCase(), result);
      return result;
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 403) throw new QrForbiddenError('No plant access');
      return this.read<QrTagResult>(this.TAG_CACHE, tag.toLowerCase());
    }
  }

  /** A drawing plus its connectors. Same network-first-then-cache rule as {@link resolveTag}. */
  async fileInfo(fileId: number): Promise<QrFileInfo | null> {
    try {
      const r = await firstValueFrom(
        this.http.get<{ responseData: QrFileInfo }>(`${this.base}/file/${fileId}`).pipe(timeout(20000))
      );
      const info = r?.responseData ?? null;
      if (info) this.write(this.FILE_CACHE, String(fileId), info);
      return info;
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 403) throw new QrForbiddenError('No plant access');
      return this.read<QrFileInfo>(this.FILE_CACHE, String(fileId));
    }
  }

  // ── Cache plumbing ──────────────────────────────────────────────────────────

  private read<T>(store: string, key: string): T | null {
    try {
      const all = JSON.parse(localStorage.getItem(store) || '{}') as Record<string, T>;
      return all[key] ?? null;
    } catch {
      return null;
    }
  }

  private write<T>(store: string, key: string, value: T): void {
    try {
      const all = JSON.parse(localStorage.getItem(store) || '{}') as Record<string, T>;
      // Re-insert last so key order doubles as eviction order (oldest first).
      delete all[key];
      all[key] = value;
      const keys = Object.keys(all);
      for (const stale of keys.slice(0, Math.max(0, keys.length - this.MAX_ENTRIES))) delete all[stale];
      localStorage.setItem(store, JSON.stringify(all));
    } catch {
      // A full or unavailable quota must never break a scan — the network answer is already in hand.
    }
  }
}
