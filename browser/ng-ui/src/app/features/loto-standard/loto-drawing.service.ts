import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LotoStandardApiService } from './loto-standard-api.service';
import { PointDrawing } from './loto-standard.model';

/**
 * Offline store + fetcher for LOTO point drawings. Descriptors (per-point highlight rectangles) and the drawing
 * image blobs live in IndexedDB (blobs are too big for localStorage). {@link precache} is called when a standard
 * is opened online so every point's drawing is available with no signal in the field; the viewer reads from the
 * cache first and only hits the network as a fallback.
 */
@Injectable({ providedIn: 'root' })
export class LotoDrawingService {
  private api = inject(LotoStandardApiService);

  private readonly DB = 'loto-drawings-v2'; // bumped: abandon caches from the earlier (empty) resolver
  private readonly VERSION = 1;
  private readonly IMAGES = 'images';           // key: fileId  → Blob
  private readonly DESCRIPTORS = 'descriptors'; // key: standardId → PointDrawing[]
  private dbPromise?: Promise<IDBDatabase>;

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Fetch + cache a standard's drawing descriptors and unique image blobs. Safe to call fire-and-forget. */
  async precache(standardId: number): Promise<void> {
    let list: PointDrawing[];
    try {
      list = await firstValueFrom(this.api.getDrawings(standardId));
    } catch {
      return; // offline / error — keep whatever is already cached
    }
    if (!list || !list.length) return; // nothing to cache (don't persist an empty list)
    await this.put(this.DESCRIPTORS, standardId, list).catch(() => {});
    const uniqueIds = [...new Set(list.map(d => d.fileId))];
    for (const fileId of uniqueIds) {
      if (await this.hasImage(fileId)) continue;
      try {
        const blob = await firstValueFrom(this.api.getDrawingImage(fileId));
        if (blob && blob.size) await this.put(this.IMAGES, fileId, blob);
      } catch { /* a missing/unavailable drawing shouldn't fail the batch */ }
    }
  }

  /**
   * All descriptors for a standard, cache-first. Returns `null` when it genuinely can't determine them
   * (offline and never cached, or the endpoint errored) so callers can tell "no drawings" from "unknown".
   */
  async drawingDescriptors(standardId: number): Promise<PointDrawing[] | null> {
    const cached = await this.get<PointDrawing[]>(this.DESCRIPTORS, standardId);
    if (cached && cached.length) return cached; // only trust a non-empty cache; re-fetch if empty/absent
    try {
      const list = await firstValueFrom(this.api.getDrawings(standardId));
      if (list) {
        if (list.length) await this.put(this.DESCRIPTORS, standardId, list).catch(() => {});
        return list;
      }
      return null;
    } catch {
      return cached ?? null;
    }
  }

  /** Cached descriptors for a single point. */
  async drawingsForPoint(standardId: number, pointId: number): Promise<PointDrawing[]> {
    return ((await this.drawingDescriptors(standardId)) ?? []).filter(d => d.pointId === pointId);
  }

  /** An object URL for a drawing image (from cache, else fetched + cached). Caller must revokeObjectURL. */
  async imageObjectUrl(fileId: number): Promise<string | null> {
    let blob = await this.getImage(fileId);
    if (!blob) {
      try {
        blob = await firstValueFrom(this.api.getDrawingImage(fileId));
        if (blob && blob.size) await this.put(this.IMAGES, fileId, blob);
      } catch { blob = null; }
    }
    return blob && blob.size ? URL.createObjectURL(blob) : null;
  }

  private async hasImage(fileId: number): Promise<boolean> {
    return !!(await this.getImage(fileId));
  }
  private getImage(fileId: number): Promise<Blob | null> {
    return this.get<Blob>(this.IMAGES, fileId);
  }

  // ── IndexedDB plumbing ───────────────────────────────────────────────────────

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB, this.VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.IMAGES)) db.createObjectStore(this.IMAGES);
        if (!db.objectStoreNames.contains(this.DESCRIPTORS)) db.createObjectStore(this.DESCRIPTORS);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  private async put(store: string, key: IDBValidKey, value: unknown): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async get<T>(store: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  }
}
